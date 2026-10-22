import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import EventRecord from '../models/EventRecord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load seed events
const getSeedEvents = () => {
  try {
    const seedPath = path.join(__dirname, '../data/seedEvents.json');
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('[EventController] Error reading seedEvents.json:', err.message);
  }
  return [];
};

// Helper to load metadata lookups
const getEventMetadata = () => {
  try {
    const metaPath = path.join(__dirname, '../data/eventMetadata.json');
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('[EventController] Error reading eventMetadata.json:', err.message);
  }
  return {};
};

// Auto-seed if database is empty
const ensureSeeded = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return;
    }
    const count = await EventRecord.countDocuments({ isDeleted: false });
    if (count === 0) {
      const seedData = getSeedEvents();
      if (seedData && seedData.length > 0) {
        console.log(`[EventController] Seeding ${seedData.length} official event records from spreadsheet...`);
        const prepared = seedData.map((item, idx) => ({
          ...item,
          sl: item.sl || idx + 1,
          dateFrom: item.dateFrom ? new Date(item.dateFrom) : new Date(),
          dateTo: item.dateTo ? new Date(item.dateTo) : null,
          auditTrail: [
            {
              action: 'IMPORT_SEEDED',
              performedBy: 'System Seeder',
              details: 'Initial record imported from official CBDP Event Tracker spreadsheet',
              timestamp: new Date(),
            },
          ],
        }));
        await EventRecord.insertMany(prepared);
        console.log('[EventController] Official event records seeded successfully.');
      }
    }
  } catch (err) {
    console.warn('[EventController] Auto-seed warning:', err.message);
  }
};

// Also listen for mongoose connect event to seed automatically on startup
mongoose.connection.on('connected', () => {
  ensureSeeded();
});

// Helper to generate official Event ID: YYYYMMXXEVNN
export const generateEventId = async (dateStr, orgName, eventType) => {
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  
  // Org 2-letter prefix
  let orgCode = 'CB';
  if (orgName) {
    const cleanOrg = orgName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanOrg.length >= 2) {
      orgCode = cleanOrg.slice(0, 2);
    }
  }

  // Type 2-letter prefix
  let typeCode = 'EV';
  if (eventType) {
    const cleanType = eventType.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanType.length >= 2) {
      typeCode = cleanType.slice(0, 2);
    }
  }

  const prefix = `${year}${month}${orgCode}${typeCode}`;
  
  // Find highest sequence for this prefix
  const regex = new RegExp(`^${prefix}(\\d{2})$`, 'i');
  const existing = await EventRecord.find({ eventId: regex }).select('eventId').lean();
  
  let maxSeq = 0;
  existing.forEach(e => {
    const match = e.eventId.match(/(\d{2})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  return `${prefix}${nextSeq}`;
};

// 1. Get all events with Search, Cascading Location Filters, Sort, and Pagination
export const getEvents = async (req, res) => {
  try {
    await ensureSeeded();

    const {
      search,
      division,
      district,
      upazila,
      union,
      eventType,
      eventTheme,
      eventLevel,
      implementingOrg,
      consortiumPartner,
      govRepresentativePresent,
      conflictPrevention,
      indirectReach,
      status,
      startDate,
      endDate,
      sortBy = 'dateFrom',
      sortOrder = 'desc',
      page = 1,
      limit = 25,
    } = req.query;

    const query = { isDeleted: false };

    // Cascading Location Filters
    if (division && division !== 'ALL') {
      query.division = division;
    }
    if (district && district !== 'ALL') {
      query.district = district;
    }
    if (upazila && upazila !== 'ALL') {
      query.upazila = upazila;
    }
    if (union && union !== 'ALL') {
      query.union = union;
    }

    // Categorical Filters
    if (eventType && eventType !== 'ALL') {
      query.eventType = eventType;
    }
    if (eventTheme && eventTheme !== 'ALL') {
      query.eventTheme = eventTheme;
    }
    if (eventLevel && eventLevel !== 'ALL') {
      query.eventLevel = eventLevel;
    }
    if (implementingOrg && implementingOrg !== 'ALL') {
      query.implementingOrg = implementingOrg;
    }
    if (consortiumPartner && consortiumPartner !== 'ALL') {
      query.consortiumPartner = consortiumPartner;
    }
    if (govRepresentativePresent && govRepresentativePresent !== 'ALL') {
      query.govRepresentativePresent = govRepresentativePresent;
    }
    if (conflictPrevention && conflictPrevention !== 'ALL') {
      query.conflictPrevention = conflictPrevention;
    }
    if (indirectReach && indirectReach !== 'ALL') {
      query.indirectReach = indirectReach;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.dateFrom = {};
      if (startDate) {
        query.dateFrom.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateFrom.$lte = end;
      }
    }

    // Global Search across ID, Title, Org, Partner, Locations, Descriptions
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { eventId: regex },
        { eventTitle: regex },
        { implementingOrg: regex },
        { consortiumPartner: regex },
        { district: regex },
        { upazila: regex },
        { union: regex },
        { eventType: regex },
        { eventTheme: regex },
        { actionsAgreed: regex },
        { govResponseDetails: regex },
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      EventRecord.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      EventRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('[EventController] getEvents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get dynamic dashboard stats & metrics
export const getEventStats = async (req, res) => {
  try {
    await ensureSeeded();

    const { division, district } = req.query;
    const baseMatch = { isDeleted: false };
    if (division && division !== 'ALL') baseMatch.division = division;
    if (district && district !== 'ALL') baseMatch.district = district;

    const [
      totalEvents,
      statusCounts,
      reachAgg,
      govAgg,
      conflictAgg,
      divisionBreakdown,
      themeBreakdown,
      typeBreakdown,
    ] = await Promise.all([
      EventRecord.countDocuments(baseMatch),

      EventRecord.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      EventRecord.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalDirectParticipants: { $sum: '$participantCountCommunity' },
            totalIndirectReach: { $sum: '$estimatedAudienceReach' },
            eventsWithIndirectReach: {
              $sum: { $cond: [{ $eq: ['$indirectReach', 'Yes'] }, 1, 0] },
            },
          },
        },
      ]),

      EventRecord.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            eventsWithGov: {
              $sum: { $cond: [{ $eq: ['$govRepresentativePresent', 'Yes'] }, 1, 0] },
            },
            totalGovParticipants: { $sum: '$govRepresentativeCount' },
            positiveResponse: {
              $sum: { $cond: [{ $eq: ['$govResponse', 'Positive'] }, 1, 0] },
            },
          },
        },
      ]),

      EventRecord.countDocuments({ ...baseMatch, conflictPrevention: 'Yes' }),

      EventRecord.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$division', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      EventRecord.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$eventTheme', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      EventRecord.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const statuses = { Upcoming: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
    statusCounts.forEach(s => {
      if (s._id) statuses[s._id] = s.count;
    });

    const reachData = reachAgg[0] || {
      totalDirectParticipants: 0,
      totalIndirectReach: 0,
      eventsWithIndirectReach: 0,
    };

    const govData = govAgg[0] || {
      eventsWithGov: 0,
      totalGovParticipants: 0,
      positiveResponse: 0,
    };

    res.json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents: statuses.Upcoming,
        completedEvents: statuses.Completed,
        inProgressEvents: statuses['In Progress'],
        totalDirectParticipants: reachData.totalDirectParticipants,
        totalIndirectReach: reachData.totalIndirectReach,
        eventsWithIndirectReach: reachData.eventsWithIndirectReach,
        eventsWithGov: govData.eventsWithGov,
        totalGovParticipants: govData.totalGovParticipants,
        positiveGovResponses: govData.positiveResponse,
        conflictPreventionEvents: conflictAgg,
        divisionBreakdown,
        themeBreakdown,
        typeBreakdown,
      },
    });
  } catch (error) {
    console.error('[EventController] getEventStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventRecord.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create new event
export const createEvent = async (req, res) => {
  try {
    const payload = req.body;

    // Validate required fields
    if (!payload.eventTitle || !payload.implementingOrg || !payload.eventType || !payload.eventTheme || !payload.division || !payload.district) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: Event Title, Implementing Org, Event Type, Event Theme, Division, and District.',
      });
    }

    // Determine or generate Event ID
    let eventId = payload.eventId ? payload.eventId.trim().toUpperCase() : '';
    if (!eventId) {
      eventId = await generateEventId(payload.dateFrom, payload.implementingOrg, payload.eventType);
    } else {
      // Check for duplicate ID
      const existing = await EventRecord.findOne({ eventId, isDeleted: false });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Event ID ${eventId} is already registered. Please choose or auto-generate a unique ID.`,
        });
      }
    }

    // Determine next SL number
    const maxSlRecord = await EventRecord.findOne().sort({ sl: -1 }).select('sl').lean();
    const nextSl = (maxSlRecord?.sl || 0) + 1;

    // Extract user for audit
    const performedBy = req.user?.name || req.user?.email || 'Authorized HR Officer';
    const userEmail = req.user?.email || '';
    const role = req.user?.role || 'Admin';

    const newEvent = new EventRecord({
      ...payload,
      sl: nextSl,
      eventId,
      dateFrom: payload.dateFrom ? new Date(payload.dateFrom) : new Date(),
      dateTo: payload.dateTo ? new Date(payload.dateTo) : null,
      auditTrail: [
        {
          action: 'CREATED',
          performedBy,
          userEmail,
          role,
          timestamp: new Date(),
          details: `Event ${eventId} (${payload.eventTitle}) created`,
        },
      ],
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: `Event ${eventId} registered successfully`,
      data: newEvent,
    });
  } catch (error) {
    console.error('[EventController] createEvent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update existing event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const event = await EventRecord.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check duplicate eventId if changed
    if (payload.eventId && payload.eventId.toUpperCase() !== event.eventId) {
      const dup = await EventRecord.findOne({
        _id: { $ne: id },
        eventId: payload.eventId.toUpperCase(),
        isDeleted: false,
      });
      if (dup) {
        return res.status(400).json({
          success: false,
          message: `Event ID ${payload.eventId} is already in use by another record.`,
        });
      }
    }

    const performedBy = req.user?.name || req.user?.email || 'Authorized HR Officer';
    const userEmail = req.user?.email || '';
    const role = req.user?.role || 'Admin';

    // Apply updates
    Object.keys(payload).forEach(key => {
      if (key !== '_id' && key !== 'sl' && key !== 'auditTrail') {
        event[key] = payload[key];
      }
    });

    if (payload.dateFrom) event.dateFrom = new Date(payload.dateFrom);
    if (payload.dateTo) event.dateTo = new Date(payload.dateTo);

    event.auditTrail.push({
      action: 'UPDATED',
      performedBy,
      userEmail,
      role,
      timestamp: new Date(),
      details: `Event ${event.eventId} details updated`,
    });

    await event.save();

    res.json({
      success: true,
      message: `Event ${event.eventId} updated successfully`,
      data: event,
    });
  } catch (error) {
    console.error('[EventController] updateEvent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete event (soft delete)
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventRecord.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const performedBy = req.user?.name || req.user?.email || 'Authorized HR Officer';
    const userEmail = req.user?.email || '';
    const role = req.user?.role || 'Admin';

    event.isDeleted = true;
    event.deletedAt = new Date();
    event.auditTrail.push({
      action: 'DELETED',
      performedBy,
      userEmail,
      role,
      timestamp: new Date(),
      details: `Event ${event.eventId} deleted`,
    });

    await event.save();

    res.json({
      success: true,
      message: `Event ${event.eventId} deleted from active register.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Export events as CSV / JSON
export const exportEvents = async (req, res) => {
  try {
    const events = await EventRecord.find({ isDeleted: false }).sort({ sl: 1 }).lean();
    res.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Get Lookups & Metadata
export const getMetadata = (req, res) => {
  try {
    const meta = getEventMetadata();
    res.json({
      success: true,
      data: meta,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
