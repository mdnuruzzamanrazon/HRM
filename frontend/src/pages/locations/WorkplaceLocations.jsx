import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  MapPin, Plus, Edit, Trash2, Power, ShieldCheck, CheckCircle2, 
  AlertCircle, Building2, Search, Sliders, Navigation, Globe,
  Crosshair, Loader2, Sparkles, X, ChevronRight, Layers, Info,
  Star, Compass, ExternalLink, HelpCircle, Check, ArrowRight
} from 'lucide-react';
import LocationPickerMap from '../../components/maps/LocationPickerMap';
import { 
  parseLocationInput, 
  calculateDistanceMeters, 
  isValidCoordinate, 
  isReversedCoordinates 
} from '../../utils/geoParser';
import WorkplaceOverviewMap from '../../components/maps/WorkplaceOverviewMap';

export default function WorkplaceLocations() {
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [pastedLink, setPastedLink] = useState('');

  // Simulator / Test Geofence Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTarget, setTestTarget] = useState(null);
  const [testCoords, setTestCoords] = useState({ lat: 0, lng: 0 });
  const [testResult, setTestResult] = useState(null);
  const [testLocating, setTestLocating] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
    latitude: 37.774929,
    longitude: -122.419416,
    radiusMeters: 100,
    maxAccuracyThreshold: 200,
    isDefault: false,
    isActive: true,
    geofenceEnforced: true,
    description: '',
  });

  const fetchWorkplaces = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workplaces?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      if (res.data?.success) {
        setWorkplaces(res.data.data || []);
        if (res.data.data?.length > 0 && !selectedWorkplace) {
          const defaultWp = res.data.data.find(w => w.isDefault) || res.data.data[0];
          setSelectedWorkplace(defaultWp);
        }
      }
    } catch (err) {
      console.error('Failed to load workplace locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkplaces();
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError('');
    setFormSuccess('');
    setPastedLink('');
    setFormData({
      name: '',
      code: `BR-${Math.floor(100 + Math.random() * 900)}`,
      address: '',
      city: '',
      country: '',
      latitude: selectedWorkplace?.coordinates?.lat || 37.774929,
      longitude: selectedWorkplace?.coordinates?.lng || -122.419416,
      radiusMeters: 100,
      maxAccuracyThreshold: 200,
      isDefault: workplaces.length === 0,
      isActive: true,
      geofenceEnforced: true,
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (wp) => {
    setEditingId(wp._id);
    setFormError('');
    setFormSuccess('');
    setPastedLink('');
    setFormData({
      name: wp.name || '',
      code: wp.code || '',
      address: wp.address || '',
      city: wp.city || '',
      country: wp.country || '',
      latitude: wp.coordinates?.lat || 37.774929,
      longitude: wp.coordinates?.lng || -122.419416,
      radiusMeters: wp.radiusMeters || 100,
      maxAccuracyThreshold: wp.maxAccuracyThreshold || 200,
      isDefault: Boolean(wp.isDefault),
      isActive: Boolean(wp.isActive),
      geofenceEnforced: wp.geofenceEnforced !== undefined ? Boolean(wp.geofenceEnforced) : true,
      description: wp.description || '',
    });
    setModalOpen(true);
  };

  const handleFormMapChange = ({ lat, lng, radiusMeters, name, address, city, country }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      ...(radiusMeters !== undefined ? { radiusMeters } : {}),
      ...(name && !prev.name.trim() ? { name } : {}),
      ...(address ? { address } : {}),
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
    }));
  };

  // Google Maps link & coordinates paste parser
  const handlePastedLinkParse = (text) => {
    setPastedLink(text);
    const parsed = parseLocationInput(text);
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        latitude: parsed.lat,
        longitude: parsed.lng,
      }));
      setFormSuccess(
        parsed.wasSwapped
          ? `Extracted GPS coordinates: ${parsed.lat}, ${parsed.lng} (Auto-corrected inverted Latitude/Longitude)`
          : `Extracted GPS coordinates: ${parsed.lat}, ${parsed.lng}`
      );
      setTimeout(() => setFormSuccess(''), 4500);
    }
  };

  // Quick swap coordinates if user accidentally inverted lat and lng
  const handleSwapCoordinates = () => {
    setFormData((prev) => ({
      ...prev,
      latitude: prev.longitude,
      longitude: prev.latitude,
    }));
    setFormSuccess('Swapped Latitude and Longitude values!');
    setTimeout(() => setFormSuccess(''), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim()) {
      setFormError('Workplace name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Branch code is required.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Physical address is required.');
      return;
    }

    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setFormError('Valid numeric GPS coordinates are required.');
      return;
    }

    if (Math.abs(lat) > 90) {
      setFormError(`Latitude ${lat}° is invalid (must be between -90° and +90°). Did you enter Longitude as Latitude? Click "Swap Lat/Lng" below.`);
      return;
    }

    if (Math.abs(lng) > 180) {
      setFormError(`Longitude ${lng}° is invalid (must be between -180° and +180°).`);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        radiusMeters: Number(formData.radiusMeters),
        maxAccuracyThreshold: Number(formData.maxAccuracyThreshold),
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        geofenceEnforced: formData.geofenceEnforced,
        description: formData.description.trim(),
      };

      if (editingId) {
        const res = await api.put(`/workplaces/${editingId}`, payload);
        if (res.data?.success) {
          setFormSuccess('Workplace location updated successfully!');
          await fetchWorkplaces();
          setTimeout(() => setModalOpen(false), 800);
        }
      } else {
        const res = await api.post('/workplaces', payload);
        if (res.data?.success) {
          setFormSuccess('Custom workplace location saved successfully!');
          await fetchWorkplaces();
          setTimeout(() => setModalOpen(false), 800);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save workplace location.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimaryHQ = async (wp) => {
    try {
      const res = await api.put(`/workplaces/${wp._id}`, { isDefault: true });
      if (res.data?.success) {
        await fetchWorkplaces();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set primary HQ');
    }
  };

  const handleToggleStatus = async (wp) => {
    try {
      const res = await api.patch(`/workplaces/${wp._id}/status`);
      if (res.data?.success) {
        await fetchWorkplaces();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (wp, force = false) => {
    const confirmMsg = force 
      ? `Permanently delete '${wp.name}' (${wp.code}) from database? This cannot be undone.`
      : `Delete '${wp.name}' (${wp.code})?\n\nIf historical attendance records exist, it will be deactivated to protect historical records.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/workplaces/${wp._id}${force ? '?force=true' : ''}`);
      if (res.data?.success) {
        await fetchWorkplaces();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete workplace');
    }
  };

  // Open Geofence Simulator Modal
  const openGeofenceSimulator = (wp) => {
    setTestTarget(wp);
    setTestCoords({
      lat: wp.coordinates.lat,
      lng: wp.coordinates.lng,
    });
    setTestResult(null);
    setTestModalOpen(true);
  };

  const runSimulation = (simLat, simLng) => {
    if (!testTarget) return;
    const distance = calculateDistanceMeters(simLat, simLng, testTarget.coordinates.lat, testTarget.coordinates.lng);
    const permitted = testTarget.radiusMeters;
    const isInside = distance <= permitted;
    setTestResult({
      distance,
      permitted,
      isInside,
      excess: isInside ? 0 : distance - permitted,
    });
  };

  const simulateWithCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setTestLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLat = Number(pos.coords.latitude.toFixed(6));
        const myLng = Number(pos.coords.longitude.toFixed(6));
        setTestCoords({ lat: myLat, lng: myLng });
        runSimulation(myLat, myLng);
        setTestLocating(false);
      },
      (err) => {
        setTestLocating(false);
        alert(err.message || 'Unable to get current GPS location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // KPI Stats
  const totalLocations = workplaces.length;
  const activeLocations = workplaces.filter(w => w.isActive).length;
  const defaultWp = workplaces.find(w => w.isDefault);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Dynamic MongoDB Geofencing
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Google Maps & Satellite Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-emerald-600 shrink-0" />
            Workplace Locations & Geofence Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configure custom corporate offices, branches, and field locations directly from Google Maps. Set permitted attendance radiuses and manage geofence perimeters.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all shrink-0 hover:shadow-emerald-600/25 hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Workplace</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Facilities</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalLocations}</p>
            <p className="text-xs text-slate-500 mt-0.5">Configured branches</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Geofences</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeLocations}</p>
            <p className="text-xs text-emerald-600/80 font-medium mt-0.5">Enforcing attendance</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary HQ</p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate max-w-[130px]" title={defaultWp?.name}>
              {defaultWp ? defaultWp.name : 'None set'}
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">{defaultWp ? defaultWp.code : 'Set Default'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Status</p>
            <p className="text-base font-bold text-slate-900 mt-1">Live Sync Active</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Zero code redeploy needed</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by workplace name, code, address, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalLocations})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active ({activeLocations})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inactive ({totalLocations - activeLocations})
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Directory Table
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'map' ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <WorkplaceOverviewMap
            workplaces={workplaces}
            selectedWorkplaceId={selectedWorkplace?._id}
            height="560px"
            onSelectWorkplace={(wp) => setSelectedWorkplace(wp)}
          />
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${viewMode === 'split' ? 'lg:grid-cols-12' : ''} gap-6`}>
          {/* Map Preview Column (in split view) */}
          {viewMode === 'split' && (
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Interactive Facility Overview
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {workplaces.length} mapped {workplaces.length === 1 ? 'branch' : 'branches'}
                  </span>
                </div>

                <WorkplaceOverviewMap
                  workplaces={workplaces}
                  selectedWorkplaceId={selectedWorkplace?._id}
                  height="340px"
                  onSelectWorkplace={(wp) => setSelectedWorkplace(wp)}
                />

                {selectedWorkplace && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{selectedWorkplace.name}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {selectedWorkplace.radiusMeters}m Radius
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{selectedWorkplace.address}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                      <span className="font-mono text-slate-500">
                        {selectedWorkplace.coordinates?.lat}, {selectedWorkplace.coordinates?.lng}
                      </span>
                      <button
                        onClick={() => openGeofenceSimulator(selectedWorkplace)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Test Geofence</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Guidance */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dynamic Geofence Enforcement
                </div>
                <p className="text-emerald-900/90 leading-relaxed">
                  Every custom workplace created here is stored in MongoDB and dynamically verified during employee check-ins and check-outs using backend Haversine distance calculations.
                </p>
                <div className="text-[11px] text-emerald-800 font-medium pt-1">
                  &bull; HR can add or delete any workplace at will.<br/>
                  &bull; Employees outside the perimeter are blocked automatically.
                </div>
              </div>
            </div>
          )}

          {/* Directory Column */}
          <div className={viewMode === 'split' ? 'lg:col-span-7' : 'w-full'}>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800">
                  Custom & Configured Workplaces ({workplaces.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Click a row to inspect on map
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                  <p className="text-xs font-medium">Loading workplace facilities...</p>
                </div>
              ) : workplaces.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No workplace locations found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {search ? 'No locations match your search query.' : 'Add your first custom workplace location using the button below.'}
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    Add Custom Workplace
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Workplace & Code</th>
                        <th className="py-3 px-4">Address</th>
                        <th className="py-3 px-4">Coordinates</th>
                        <th className="py-3 px-4">Permitted Radius</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workplaces.map((wp) => {
                        const isSelected = selectedWorkplace?._id === wp._id;
                        return (
                          <tr
                            key={wp._id}
                            onClick={() => setSelectedWorkplace(wp)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {wp.name}
                                {wp.isDefault && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                                    Primary HQ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {wp.code}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 max-w-[200px]">
                              <p className="truncate text-slate-800" title={wp.address}>
                                {wp.address}
                              </p>
                              <p className="text-[11px] text-slate-500">{wp.city || 'N/A'}</p>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                              <div>{Number(wp.coordinates?.lat).toFixed(5)}</div>
                              <div>{Number(wp.coordinates?.lng).toFixed(5)}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Crosshair className="w-3 h-3 text-emerald-600" />
                                {wp.radiusMeters} m
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  wp.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {wp.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {/* Set as HQ Star Button */}
                                {!wp.isDefault && (
                                  <button
                                    onClick={() => handleSetPrimaryHQ(wp)}
                                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Set as Primary Headquarters"
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Geofence Simulator Button */}
                                <button
                                  onClick={() => openGeofenceSimulator(wp)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Test Geofence Range"
                                >
                                  <Compass className="w-4 h-4" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => handleOpenEditModal(wp)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit Workplace Location"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {/* Toggle Active/Inactive */}
                                <button
                                  onClick={() => handleToggleStatus(wp)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    wp.isActive
                                      ? 'text-amber-600 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={wp.isActive ? 'Deactivate Location' : 'Activate Location'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDelete(wp, false)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Location"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Workplace Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-modal-backdrop">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-modal-card">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  {editingId ? 'Edit Custom Workplace' : 'Configure New Custom Workplace'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any location on Google Maps by searching, clicking the map, pasting coordinates, or moving the pin.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Quick Google Maps URL / GPS Paste Helper */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  Quick Google Maps Link or GPS Coordinates Parser:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Paste maps.google.com link or coordinates like '40.7128, -74.0060'..."
                    value={pastedLink}
                    onChange={(e) => handlePastedLinkParse(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pastedLink && (
                    <button
                      type="button"
                      onClick={() => setPastedLink('')}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Copy any location URL from Google Maps and paste here &mdash; latitude, longitude, and map pin will auto-adjust!
                </span>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workplace Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown Innovation Center"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch Identifier Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-001, HQ-MAIN"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Physical Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street address, building, or landmark"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Interactive Google Maps / Satellite Location Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Interactive Map Selection & Geofence Boundary
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Search above or click map to move boundary
                  </span>
                </div>

                <LocationPickerMap
                  lat={formData.latitude}
                  lng={formData.longitude}
                  radiusMeters={formData.radiusMeters}
                  onChange={handleFormMapChange}
                  height="260px"
                />
              </div>

              {/* GPS Coordinates Inputs (Synced Two-Way with Coordinate Reversal Protection) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                    Exact GPS Coordinates (Synced with Map Marker)
                  </span>
                  <button
                    type="button"
                    onClick={handleSwapCoordinates}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
                    title="Swap Latitude and Longitude if entered in reverse order"
                  >
                    <ArrowRight className="w-3 h-3 rotate-45" />
                    <span>Swap Lat/Lng</span>
                  </button>
                </div>

                {(Math.abs(Number(formData.latitude)) > 90 || isReversedCoordinates(formData.latitude, formData.longitude)) && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Latitude cannot exceed ±90°. Longitude was likely entered first.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSwapCoordinates}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] shrink-0 cursor-pointer"
                    >
                      Swap Now
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Latitude (-90 to +90)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Longitude (-180 to +180)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Permitted Radius Configuration */}
              <div className="space-y-2.5 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Permitted Attendance Radius
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Employees must be physically within this boundary from the center to check in/out.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs">
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      value={formData.radiusMeters}
                      onChange={(e) => setFormData({ ...formData, radiusMeters: Math.max(10, parseInt(e.target.value) || 10) })}
                      className="w-16 text-right font-bold text-emerald-700 text-sm focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-emerald-800">meters</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={Math.min(1000, formData.radiusMeters)}
                  onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                  {[50, 100, 150, 250, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, radiusMeters: preset })}
                      className={`px-2.5 py-1 text-[11px] rounded font-semibold transition-all ${
                        formData.radiusMeters === preset
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.geofenceEnforced}
                    onChange={(e) => setFormData({ ...formData, geofenceEnforced: e.target.checked })}
                    className="mt-0.5 accent-emerald-600 rounded"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">
                      Enforce Geofence Restriction
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Block check-in if outside permitted radius.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mt-0.5 accent-emerald-600 rounded"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">
                      Primary Headquarters
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Set as main corporate facility.
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingId ? 'Update Workplace' : 'Save Custom Workplace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Geofence Simulator / Testing Modal */}
      {testModalOpen && testTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-modal-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                Test Geofence Range: {testTarget.name}
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Verify attendance eligibility for any coordinate. Test whether an employee at a given point will be approved or blocked by the server.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1 font-mono">
              <div className="text-slate-500 font-sans font-semibold">Target Facility Center:</div>
              <div>Lat: {testTarget.coordinates.lat}, Lng: {testTarget.coordinates.lng}</div>
              <div className="text-emerald-700 font-bold">Permitted Boundary: {testTarget.radiusMeters} meters</div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Test Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={testCoords.lat}
                    onChange={(e) => setTestCoords({ ...testCoords, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Test Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={testCoords.lng}
                    onChange={(e) => setTestCoords({ ...testCoords, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={simulateWithCurrentGPS}
                  disabled={testLocating}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  {testLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>Use My Current GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => runSimulation(testCoords.lat, testCoords.lng)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
                >
                  Calculate Proximity
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  testResult.isInside
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    {testResult.isInside ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ELIGIBLE (Within Boundary)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>BLOCKED (Outside Authorized Area)</span>
                      </>
                    )}
                  </div>
                  <p>
                    Calculated Distance: <strong>{testResult.distance} meters</strong> (Permitted radius: {testResult.permitted}m)
                  </p>
                  {!testResult.isInside && (
                    <p className="text-rose-700 font-semibold">
                      Employee would be blocked with: "You are outside the authorized workplace area. Please move within the permitted location to check in or check out." ({testResult.excess}m outside boundary).
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
