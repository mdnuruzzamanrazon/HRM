import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import EventRecord from '../models/EventRecord.js';
import { RiskProject } from '../models/RiskProject.js';
import { AuditLog } from '../models/AuditLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData, saveStoreToDisk } from '../services/mockDataService.js';
import { authorizeRecordProjectAccess } from '../middlewares/projectAuth.js';

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

const ensureDemoEventsSeeded = () => {
  if (!Array.isArray(mockData.eventRecords)) {
    mockData.eventRecords = [];
  }
  if (mockData.eventRecords.length <= 1) {
    const seedData = getSeedEvents();
    const cbdpProj = (mockData.riskProjects || []).find(
      (p) => p.code === 'PRJ-CBDP' || (p.name && p.name.includes('CBDP'))
    );
    if (seedData.length > 0 && cbdpProj) {
      const existingIds = new Set(mockData.eventRecords.map((e) => e.eventId));
      seedData.forEach((item, idx) => {
        if (!existingIds.has(item.eventId)) {
          mockData.eventRecords.push({
            ...item,
            _id: item._id || `seed-ev-${idx + 1}`,
            projectId: String(cbdpProj._id),
            projectName: cbdpProj.name,
            sl: item.sl || idx + 1,
            isDeleted: false,
            dateFrom: item.dateFrom ? new Date(item.dateFrom).toISOString() : new Date().toISOString(),
            dateTo: item.dateTo ? new Date(item.dateTo).toISOString() : null,
          });
        }
      });
    }
  }
};

// Auto-seed if database is empty
const ensureSeeded = async () => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      ensureDemoEventsSeeded();
      return;
    }
    const count = await EventRecord.countDocuments({ isDeleted: false });
    if (count === 0) {
      const seedData = getSeedEvents();
      if (seedData && seedData.length > 0) {
        const cbdpProject = await RiskProject.findOne({
          $or: [{ code: 'PRJ-CBDP' }, { name: /Community Based Development Project/i }],
          isDeleted: { $ne: true },
        }).lean();

        console.log(`[EventController] Seeding ${seedData.length} official event records from spreadsheet...`);
        const prepared = seedData.map((item, idx) => ({
          ...item,
          projectId: cbdpProject ? cbdpProject._id : undefined,
          projectName: cbdpProject ? cbdpProject.name : 'Community Based Development Project (CBDP)',
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

  let orgCode = 'CB';
  if (orgName) {
    const cleanOrg = orgName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanOrg.length >= 2) {
      orgCode = cleanOrg.slice(0, 2);
    }
  }

  let typeCode = 'EV';
  if (eventType) {
    const cleanType = eventType.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanType.length >= 2) {
      typeCode = cleanType.slice(0, 2);
    }
  }

  const prefix = `${year}${month}${orgCode}${typeCode}`;
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    let maxSeq = 0;
    (mockData.eventRecords || []).forEach((e) => {
      const m = String(e.eventId || '').match(regex);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
  }

  const existing = await EventRecord.find({ eventId: regex }).select('eventId').lean();
  let maxSeq = 0;
  existing.forEach((e) => {
    const match = String(e.eventId || '').match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });

  let nextNum = maxSeq + 1;
  let candidate = `${prefix}${String(nextNum).padStart(2, '0')}`;
  while (await EventRecord.findOne({ eventId: candidate }).select('_id').lean()) {
    nextNum += 1;
    candidate = `${prefix}${String(nextNum).padStart(2, '0')}`;
  }
  return candidate;
};

const normalizeStatusLabel = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'upcoming') return 'Upcoming';
  if (s === 'in progress' || s === 'in_progress') return 'In Progress';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return 'Completed';
};

// 1. Get all events with Search, Cascading Location Filters, Sort, and Pagination
export const getEvents = async (req, res) => {
  try {
    await ensureSeeded();

    const {
      projectId,
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

    const activeProjectId = req.activeProjectId || projectId || req.headers['x-project-id'];
    if (!activeProjectId || activeProjectId === 'ALL') {
      return res.status(400).json({
        success: false,
        message: 'An active Project ID is required to load Event Tracker records.',
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let list = (mockData.eventRecords || []).filter(
        (e) => !e.isDeleted && String(e.projectId) === String(activeProjectId)
      );
      if (division && division !== 'ALL') list = list.filter((e) => e.division === division);
      if (district && district !== 'ALL') list = list.filter((e) => e.district === district);
      if (upazila && upazila !== 'ALL') list = list.filter((e) => e.upazila === upazila);
      if (union && union !== 'ALL') list = list.filter((e) => e.union === union);
      if (eventType && eventType !== 'ALL') list = list.filter((e) => e.eventType === eventType);
      if (eventTheme && eventTheme !== 'ALL') list = list.filter((e) => e.eventTheme === eventTheme);
      if (eventLevel && eventLevel !== 'ALL') list = list.filter((e) => e.eventLevel === eventLevel);
      if (implementingOrg && implementingOrg !== 'ALL') list = list.filter((e) => e.implementingOrg === implementingOrg);
      if (consortiumPartner && consortiumPartner !== 'ALL') list = list.filter((e) => e.consortiumPartner === consortiumPartner);
      if (govRepresentativePresent && govRepresentativePresent !== 'ALL') list = list.filter((e) => e.govRepresentativePresent === govRepresentativePresent);
      if (conflictPrevention && conflictPrevention !== 'ALL') list = list.filter((e) => e.conflictPrevention === conflictPrevention);
      if (indirectReach && indirectReach !== 'ALL') list = list.filter((e) => e.indirectReach === indirectReach);
      if (status && status !== 'ALL') list = list.filter((e) => normalizeStatusLabel(e.status) === status);
      if (startDate) list = list.filter((e) => new Date(e.dateFrom) >= new Date(startDate));
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        list = list.filter((e) => new Date(e.dateFrom) <= end);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((e) =>
          [
            e.eventId,
            e.eventTitle,
            e.implementingOrg,
            e.consortiumPartner,
            e.district,
            e.upazila,
            e.union,
            e.eventType,
            e.eventTheme,
            e.actionsAgreed,
            e.govResponseDetails,
          ].some((v) => String(v || '').toLowerCase().includes(q))
        );
      }
      list.sort((a, b) => {
        const dir = sortOrder === 'asc' ? 1 : -1;
        const va = sortBy === 'dateFrom' ? new Date(a.dateFrom || 0).getTime() : a[sortBy];
        const vb = sortBy === 'dateFrom' ? new Date(b.dateFrom || 0).getTime() : b[sortBy];
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
      const total = list.length;
      const paged = list.slice(skip, skip + limitNum);
      return res.json({
        success: true,
        data: paged,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalEvents: total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(activeProjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }

    const query = {
      isDeleted: false,
      projectId: new mongoose.Types.ObjectId(activeProjectId),
    };

    // Cascading Location Filters
    if (division && division !== 'ALL') query.division = division;
    if (district && district !== 'ALL') query.district = district;
    if (upazila && upazila !== 'ALL') query.upazila = upazila;
    if (union && union !== 'ALL') query.union = union;

    // Categorical Filters
    if (eventType && eventType !== 'ALL') query.eventType = eventType;
    if (eventTheme && eventTheme !== 'ALL') query.eventTheme = eventTheme;
    if (eventLevel && eventLevel !== 'ALL') query.eventLevel = eventLevel;
    if (implementingOrg && implementingOrg !== 'ALL') query.implementingOrg = implementingOrg;
    if (consortiumPartner && consortiumPartner !== 'ALL') query.consortiumPartner = consortiumPartner;
    if (govRepresentativePresent && govRepresentativePresent !== 'ALL') query.govRepresentativePresent = govRepresentativePresent;
    if (conflictPrevention && conflictPrevention !== 'ALL') query.conflictPrevention = conflictPrevention;
    if (indirectReach && indirectReach !== 'ALL') query.indirectReach = indirectReach;
    if (status && status !== 'ALL') query.status = status;

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
        totalEvents: total,
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

    const { division, district, projectId } = req.query;
    const activeProjectId = req.activeProjectId || projectId || req.headers['x-project-id'];
    if (!activeProjectId || activeProjectId === 'ALL') {
      return res.status(400).json({
        success: false,
        message: 'An active Project ID is required to load Event Tracker statistics.',
      });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let list = (mockData.eventRecords || []).filter(
        (e) => !e.isDeleted && String(e.projectId) === String(activeProjectId)
      );
      if (division && division !== 'ALL') list = list.filter((e) => e.division === division);
      if (district && district !== 'ALL') list = list.filter((e) => e.district === district);

      const statuses = { Upcoming: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
      let totalDirectParticipants = 0;
      let totalIndirectReach = 0;
      let eventsWithIndirectReach = 0;
      let eventsWithGov = 0;
      let totalGovParticipants = 0;
      let positiveGovResponses = 0;
      let conflictPreventionEvents = 0;
      const divMap = {};
      const themeMap = {};
      const typeMap = {};

      list.forEach((e) => {
        const st = normalizeStatusLabel(e.status);
        statuses[st] = (statuses[st] || 0) + 1;
        totalDirectParticipants += Number(e.participantCountCommunity || 0);
        totalIndirectReach += Number(e.estimatedAudienceReach || 0);
        if (e.indirectReach === 'Yes') eventsWithIndirectReach += 1;
        if (e.govRepresentativePresent === 'Yes') eventsWithGov += 1;
        totalGovParticipants += Number(e.govRepresentativeCount || 0);
        if (e.govResponse === 'Positive') positiveGovResponses += 1;
        if (e.conflictPrevention === 'Yes') conflictPreventionEvents += 1;
        if (e.division) divMap[e.division] = (divMap[e.division] || 0) + 1;
        if (e.eventTheme) themeMap[e.eventTheme] = (themeMap[e.eventTheme] || 0) + 1;
        if (e.eventType) typeMap[e.eventType] = (typeMap[e.eventType] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalEvents: list.length,
          upcomingEvents: statuses.Upcoming,
          completedEvents: statuses.Completed,
          inProgressEvents: statuses['In Progress'],
          byStatus: statuses,
          totalDirectParticipants,
          totalCommunityParticipants: totalDirectParticipants,
          totalIndirectReach,
          totalIndirectReachAudience: totalIndirectReach,
          eventsWithIndirectReach,
          indirectReachEventsCount: eventsWithIndirectReach,
          eventsWithGov,
          totalGovParticipants,
          positiveGovResponses,
          conflictPreventionEvents,
          divisionBreakdown: Object.entries(divMap).map(([_id, count]) => ({ _id, count })),
          themeBreakdown: Object.entries(themeMap).map(([_id, count]) => ({ _id, count })),
          typeBreakdown: Object.entries(typeMap).map(([_id, count]) => ({ _id, count })),
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(activeProjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }

    const baseMatch = {
      isDeleted: false,
      projectId: new mongoose.Types.ObjectId(activeProjectId),
    };
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
        { $match: baseMatch },
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
    statusCounts.forEach((s) => {
      if (s._id) {
        const key = normalizeStatusLabel(s._id);
        statuses[key] = (statuses[key] || 0) + s.count;
      }
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
        byStatus: statuses,
        totalDirectParticipants: reachData.totalDirectParticipants,
        totalCommunityParticipants: reachData.totalDirectParticipants,
        totalIndirectReach: reachData.totalIndirectReach,
        totalIndirectReachAudience: reachData.totalIndirectReach,
        eventsWithIndirectReach: reachData.eventsWithIndirectReach,
        indirectReachEventsCount: reachData.eventsWithIndirectReach,
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

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      ensureDemoEventsSeeded();
      const event = (mockData.eventRecords || []).find(
        (e) => (String(e._id) === String(id) || e.eventId === id) && !e.isDeleted
      );
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      const access = await authorizeRecordProjectAccess(req, event.projectId, 'EVENTS', 'VIEWER');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }
      return res.json({ success: true, data: event });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    const event = await EventRecord.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const access = await authorizeRecordProjectAccess(req, event.projectId, 'EVENTS', 'VIEWER');
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create new event
export const createEvent = async (req, res) => {
  try {
    const payload = { ...req.body };

    const resolvedProjectId = req.activeProjectId || payload.projectId || req.headers['x-project-id'];
    if (!resolvedProjectId || resolvedProjectId === 'ALL') {
      return res.status(400).json({
        success: false,
        message: 'An active Project ID is required to create an event record.',
      });
    }

    // Validate required fields
    if (!payload.eventTitle || !payload.implementingOrg || !payload.eventType || !payload.eventTheme || !payload.division || !payload.district) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: Event Title, Implementing Org, Event Type, Event Theme, Division, and District.',
      });
    }

    let eventId = payload.eventId ? payload.eventId.trim().toUpperCase() : '';
    if (!eventId) {
      eventId = await generateEventId(payload.dateFrom, payload.implementingOrg, payload.eventType);
    }

    const performedBy = req.user?.name || req.user?.email || 'Authorized HR Officer';
    const userEmail = req.user?.email || '';
    const role = req.user?.role || 'Admin';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      ensureDemoEventsSeeded();
      const dup = (mockData.eventRecords || []).find((e) => e.eventId === eventId && !e.isDeleted);
      if (dup) {
        return res.status(400).json({
          success: false,
          message: `Event ID ${eventId} is already registered. Please choose or auto-generate a unique ID.`,
        });
      }
      const pEvents = (mockData.eventRecords || []).filter((e) => String(e.projectId) === String(resolvedProjectId));
      const nextSl = pEvents.reduce((m, e) => Math.max(m, Number(e.sl || 0)), 0) + 1;
      const newEv = {
        ...payload,
        _id: 'ev-' + Date.now(),
        projectId: String(resolvedProjectId),
        projectName: req.project?.name || payload.projectName || '',
        sl: nextSl,
        eventId,
        status: normalizeStatusLabel(payload.status || 'Completed'),
        isDeleted: false,
        dateFrom: payload.dateFrom ? new Date(payload.dateFrom).toISOString() : new Date().toISOString(),
        dateTo: payload.dateTo ? new Date(payload.dateTo).toISOString() : null,
        auditTrail: [
          {
            action: 'CREATED',
            performedBy,
            userEmail,
            role,
            timestamp: new Date().toISOString(),
            details: `Event ${eventId} (${payload.eventTitle}) created`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockData.eventRecords.unshift(newEv);
      saveStoreToDisk();
      return res.status(201).json({
        success: true,
        message: `Event ${eventId} registered successfully`,
        data: newEv,
      });
    }

    // Check for duplicate ID across entire collection (unique index applies globally)
    const existing = await EventRecord.findOne({ eventId });
    if (existing) {
      if (payload.eventId) {
        return res.status(400).json({
          success: false,
          message: `Event ID ${eventId} is already registered. Please choose or auto-generate a unique ID.`,
        });
      }
      eventId = await generateEventId(payload.dateFrom, payload.implementingOrg, payload.eventType);
    }

    const projectObjectId = new mongoose.Types.ObjectId(resolvedProjectId);
    const maxSlRecord = await EventRecord.findOne({ projectId: projectObjectId }).sort({ sl: -1 }).select('sl').lean();
    const nextSl = (maxSlRecord?.sl || 0) + 1;

    let resolvedProjectName = req.project?.name || payload.projectName || '';
    if (!resolvedProjectName) {
      const prj = await RiskProject.findById(projectObjectId).select('name').lean();
      if (prj?.name) resolvedProjectName = prj.name;
    }

    const newEvent = new EventRecord({
      ...payload,
      projectId: projectObjectId,
      projectName: resolvedProjectName,
      sl: nextSl,
      eventId,
      status: normalizeStatusLabel(payload.status || 'Completed'),
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

    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'CREATE',
        module: 'EVENT_TRACKER',
        projectId: projectObjectId,
        resourceId: newEvent._id,
        newState: { eventId: newEvent.eventId, eventTitle: newEvent.eventTitle },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) {}

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
    const payload = { ...req.body };

    const performedBy = req.user?.name || req.user?.email || 'Authorized HR Officer';
    const userEmail = req.user?.email || '';
    const role = req.user?.role || 'Admin';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      ensureDemoEventsSeeded();
      const idx = (mockData.eventRecords || []).findIndex(
        (e) => String(e._id) === String(id) && !e.isDeleted
      );
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      const existing = mockData.eventRecords[idx];
      const access = await authorizeRecordProjectAccess(req, existing.projectId, 'EVENTS', 'EDITOR');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }
      delete payload.projectId;
      delete payload.projectName;
      delete payload._id;
      delete payload.sl;
      delete payload.auditTrail;

      Object.assign(existing, payload);
      if (payload.status) existing.status = normalizeStatusLabel(payload.status);
      if (payload.dateFrom) existing.dateFrom = new Date(payload.dateFrom).toISOString();
      if (payload.dateTo !== undefined) existing.dateTo = payload.dateTo ? new Date(payload.dateTo).toISOString() : null;
      existing.auditTrail = existing.auditTrail || [];
      existing.auditTrail.push({
        action: 'UPDATED',
        performedBy,
        userEmail,
        role,
        timestamp: new Date().toISOString(),
        details: `Event ${existing.eventId} details updated`,
      });
      existing.updatedAt = new Date().toISOString();
      saveStoreToDisk();
      return res.json({
        success: true,
        message: `Event ${existing.eventId} updated successfully`,
        data: existing,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    const event = await EventRecord.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const access = await authorizeRecordProjectAccess(req, event.projectId, 'EVENTS', 'EDITOR');
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // Check duplicate eventId if changed
    if (payload.eventId && payload.eventId.toUpperCase() !== event.eventId) {
      const dup = await EventRecord.findOne({
        _id: { $ne: id },
        eventId: payload.eventId.toUpperCase(),
      });
      if (dup) {
        return res.status(400).json({
          success: false,
          message: `Event ID ${payload.eventId} is already in use by another record.`,
        });
      }
    }

    // Apply updates while protecting immutable ownership fields
    const immutableKeys = new Set(['_id', 'sl', 'auditTrail', 'projectId', 'projectName']);
    Object.keys(payload).forEach((key) => {
      if (!immutableKeys.has(key)) {
        event[key] = payload[key];
      }
    });

    if (payload.status) event.status = normalizeStatusLabel(payload.status);
    if (payload.dateFrom) event.dateFrom = new Date(payload.dateFrom);
    if (payload.dateTo !== undefined) event.dateTo = payload.dateTo ? new Date(payload.dateTo) : null;

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
    const performedBy = req.user?.name || req.user?.email || 'Authorized HR Officer';
    const userEmail = req.user?.email || '';
    const role = req.user?.role || 'Admin';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      ensureDemoEventsSeeded();
      const event = (mockData.eventRecords || []).find(
        (e) => String(e._id) === String(id) && !e.isDeleted
      );
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      const access = await authorizeRecordProjectAccess(req, event.projectId, 'EVENTS', 'MANAGER');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }
      event.isDeleted = true;
      event.deletedAt = new Date().toISOString();
      saveStoreToDisk();
      return res.json({
        success: true,
        message: `Event ${event.eventId} deleted from active register.`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    const event = await EventRecord.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const access = await authorizeRecordProjectAccess(req, event.projectId, 'EVENTS', 'MANAGER');
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

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

// 7. Export events as CSV / JSON (strictly scoped to active project)
export const exportEvents = async (req, res) => {
  try {
    await ensureSeeded();
    const { projectId, division, district, status } = req.query;
    const activeProjectId = req.activeProjectId || projectId || req.headers['x-project-id'];
    if (!activeProjectId || activeProjectId === 'ALL') {
      return res.status(400).json({
        success: false,
        message: 'An active Project ID is required to export Event Tracker records.',
      });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let events = (mockData.eventRecords || []).filter(
        (e) => !e.isDeleted && String(e.projectId) === String(activeProjectId)
      );
      if (division && division !== 'ALL') events = events.filter((e) => e.division === division);
      if (district && district !== 'ALL') events = events.filter((e) => e.district === district);
      if (status && status !== 'ALL') events = events.filter((e) => normalizeStatusLabel(e.status) === status);
      return res.json({
        success: true,
        data: events,
        total: events.length,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(activeProjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }

    const query = {
      isDeleted: false,
      projectId: new mongoose.Types.ObjectId(activeProjectId),
    };
    if (division && division !== 'ALL') query.division = division;
    if (district && district !== 'ALL') query.district = district;
    if (status && status !== 'ALL') query.status = status;

    const events = await EventRecord.find(query).sort({ sl: 1 }).lean();
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
