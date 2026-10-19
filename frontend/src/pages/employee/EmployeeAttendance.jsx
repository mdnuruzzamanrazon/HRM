import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Clock, CheckCircle2, AlertCircle, Calendar, Plus, 
  LogIn, LogOut, ArrowRight, Loader2, Sparkles, Filter,
  MapPin, Navigation, ShieldCheck, Crosshair, HelpCircle,
  AlertTriangle, RefreshCw, Building2, ChevronDown, Check, X
} from 'lucide-react';
import WorkplaceOverviewMap from '../../components/maps/WorkplaceOverviewMap';

// Client-side Haversine distance calculator in meters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);
  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return Infinity;

  const R = 6371e3; // Earth's radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;
  const φ1 = toRad(p1);
  const φ2 = toRad(p2);
  const Δφ = toRad(p2 - p1);
  const Δλ = toRad(l2 - l1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function formatDistanceText(meters) {
  if (meters === undefined || meters === null || isNaN(meters)) return 'Unknown';
  if (meters < 1000) return `${Math.round(meters)} meters`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export default function EmployeeAttendance() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '', data: null });

  // Geofence & GPS State
  const [workplaces, setWorkplaces] = useState([]);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [deviceCoords, setDeviceCoords] = useState(null); // { lat, lng, accuracy }
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'locating' | 'ready' | 'denied' | 'unavailable' | 'error'
  const [gpsError, setGpsError] = useState('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Filter state
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Correction Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '17:00',
    reason: ''
  });

  // Fetch Attendance & Active Workplaces
  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes, correctionsRes, workplacesRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get(`/attendance/my?month=${month}&year=${year}`),
        api.get('/attendance/corrections/my'),
        api.get('/workplaces/active').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (todayRes.data?.success) setTodayStatus(todayRes.data.data);
      if (historyRes.data?.success) setAttendanceData(historyRes.data.data);
      if (correctionsRes.data?.success) setCorrections(correctionsRes.data.data || []);
      
      const activeWps = workplacesRes.data?.data || [];
      setWorkplaces(activeWps);
      if (activeWps.length > 0 && !selectedWorkplace) {
        const defaultWp = activeWps.find(w => w.isDefault) || activeWps[0];
        setSelectedWorkplace(defaultWp);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  // Request & acquire high-accuracy GPS coordinates
  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsError('Geolocation is not supported by your current browser.');
      return;
    }

    setGpsStatus('locating');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0),
        };
        setDeviceCoords(coords);
        setGpsStatus('ready');

        // Automatically select the nearest workplace if multiple exist
        if (workplaces.length > 0) {
          let nearest = workplaces[0];
          let minDistance = Infinity;
          workplaces.forEach((wp) => {
            const d = calculateDistanceMeters(coords.lat, coords.lng, wp.coordinates.lat, wp.coordinates.lng);
            if (d < minDistance) {
              minDistance = d;
              nearest = wp;
            }
          });
          setSelectedWorkplace(nearest);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setGpsStatus('denied');
          setGpsError('Location permission was denied. Please allow location access in your browser settings to verify attendance.');
        } else if (err.code === 2) {
          setGpsStatus('unavailable');
          setGpsError('GPS signal is currently unavailable. Please verify location services are enabled on your device.');
        } else if (err.code === 3) {
          setGpsStatus('error');
          setGpsError('GPS location request timed out. Please try again or move to an area with better signal reception.');
        } else {
          setGpsStatus('error');
          setGpsError(err.message || 'Failed to retrieve GPS location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Acquire location on component mount or once workplaces are loaded
  useEffect(() => {
    acquireLocation();
  }, [workplaces.length]);

  // Calculate distance from device to selected workplace
  const currentDistance = (deviceCoords && selectedWorkplace?.coordinates)
    ? calculateDistanceMeters(
        deviceCoords.lat,
        deviceCoords.lng,
        selectedWorkplace.coordinates.lat,
        selectedWorkplace.coordinates.lng
      )
    : null;

  const permittedRadius = selectedWorkplace?.radiusMeters || 100;
  const isWithinRadius = currentDistance !== null ? currentDistance <= permittedRadius : false;
  const excessDistance = (currentDistance !== null && currentDistance > permittedRadius)
    ? currentDistance - permittedRadius
    : 0;

  // Clock In / Clock Out Action with GPS enforcement
  const handleClockAction = async (action) => {
    setMessage({ text: '', type: '', data: null });

    // 1. Verify GPS coordinates are present
    if (!deviceCoords || gpsStatus !== 'ready') {
      acquireLocation();
      setMessage({
        text: 'Acquiring GPS coordinates. Please ensure browser location permissions are granted, then try again.',
        type: 'error',
      });
      return;
    }

    // 2. Client-side pre-validation
    if (selectedWorkplace?.geofenceEnforced && !isWithinRadius) {
      setMessage({
        text: 'You are outside the authorized workplace area. Please move within the permitted location to check in or check out.',
        type: 'error',
        data: {
          workplaceName: selectedWorkplace.name,
          distanceMeters: currentDistance,
          permittedRadius,
          excessMeters: excessDistance,
        }
      });
      return;
    }

    try {
      setClocking(true);
      const endpoint = action === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      
      const payload = {
        latitude: deviceCoords.lat,
        longitude: deviceCoords.lng,
        accuracy: deviceCoords.accuracy,
        workplaceId: selectedWorkplace?._id,
      };

      const res = await api.post(endpoint, payload);
      if (res.data?.success) {
        setMessage({
          text: res.data.message || (action === 'in' ? 'Clocked in successfully!' : 'Clocked out successfully!'),
          type: 'success',
          data: res.data.data,
        });
        await fetchData();
      }
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.code === 'OUTSIDE_GEOFENCE') {
        setMessage({
          text: respData.message || 'You are outside the authorized workplace area. Please move within the permitted location to check in or check out.',
          type: 'error',
          data: respData.data,
        });
      } else {
        setMessage({
          text: respData?.message || 'Attendance action failed. Please check your network and GPS settings.',
          type: 'error',
        });
      }
    } finally {
      setClocking(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      alert('Please provide a reason for the correction request.');
      return;
    }
    try {
      setSubmittingCorrection(true);
      const res = await api.post('/attendance/corrections', correctionForm);
      if (res.data?.success) {
        setMessage({ text: 'Attendance correction request submitted to HR for approval!', type: 'success' });
        setModalOpen(false);
        setCorrectionForm({
          date: new Date().toISOString().split('T')[0],
          checkInTime: '09:00',
          checkOutTime: '17:00',
          reason: ''
        });
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit correction request.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const stats = attendanceData?.stats;
  const records = attendanceData?.records || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* Top Header & Correction Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              GPS Geofence Protected
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Attendance & Work Hours
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Record verified check-ins within authorized workplace perimeter and view monthly attendance history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          Request Attendance Correction
        </button>
      </div>

      {/* Dynamic Status / Error Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium shadow-sm animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{message.text}</p>
                {message.data && (
                  <div className="text-xs space-y-0.5 pt-1 text-slate-700">
                    {message.data.workplaceName && (
                      <p>
                        Target Facility: <strong>{message.data.workplaceName}</strong>
                      </p>
                    )}
                    {message.data.distanceMeters !== undefined && (
                      <p>
                        Your Distance: <strong className="text-rose-700">{formatDistanceText(message.data.distanceMeters)}</strong>
                        {message.data.permittedRadius && ` (Permitted boundary: ${message.data.permittedRadius}m)`}
                      </p>
                    )}
                    {message.data.excessMeters !== undefined && message.data.excessMeters > 0 && (
                      <p className="text-rose-600 font-medium">
                        You are {formatDistanceText(message.data.excessMeters)} outside the authorized zone.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => setMessage({ text: '', type: '', data: null })} 
              className="text-xs font-semibold hover:underline text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* GPS Geofence Verification Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-emerald-600" />
                Physical Presence Verification & Workplace Geofence
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Attendance check-in and check-out are restricted to physical proximity within company facilities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={acquireLocation}
              disabled={gpsStatus === 'locating'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              <span>{gpsStatus === 'locating' ? 'Acquiring GPS...' : 'Refresh Location'}</span>
            </button>

            <button
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="GPS Troubleshooting Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Troubleshooting Guidance (collapsible) */}
        {showTroubleshoot && (
          <div className="p-4 bg-slate-900 text-white text-xs space-y-2 border-b border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                GPS Permission & Accuracy Instructions
              </span>
              <button onClick={() => setShowTroubleshoot(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li><strong>Chrome / Edge:</strong> Click the lock/settings icon in the URL bar &rarr; Set <em>Location</em> to <em>Allow</em> &rarr; Reload page.</li>
              <li><strong>Mobile (iOS/Android):</strong> Open Settings &rarr; Privacy & Security &rarr; Location Services &rarr; Ensure browser has precise location permission enabled.</li>
              <li><strong>Laptop/Desktop Wi-Fi:</strong> Desktop browsers utilize nearby Wi-Fi network mapping for indoor positioning. Ensure Wi-Fi is active on your device.</li>
            </ul>
          </div>
        )}

        {/* GPS Verification Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Proximity Status & Facility Info */}
          <div className="lg:col-span-7 space-y-4">
            {/* Workplace Facility Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Authorized Workplace Facility:
              </label>
              <div className="relative">
                <select
                  value={selectedWorkplace?._id || ''}
                  onChange={(e) => {
                    const wp = workplaces.find(w => w._id === e.target.value);
                    if (wp) setSelectedWorkplace(wp);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9"
                >
                  {workplaces.map((wp) => (
                    <option key={wp._id} value={wp._id}>
                      {wp.name} ({wp.code}) - {wp.city || wp.address} [Radius: {wp.radiusMeters}m]
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Live GPS Reading & Status Badge */}
            <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Your Current GPS Reading:</span>
                </div>

                {gpsStatus === 'locating' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Acquiring coordinates...
                  </span>
                ) : gpsStatus === 'ready' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    GPS Signal Locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Location Unavailable
                  </span>
                )}
              </div>

              {deviceCoords ? (
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Latitude</span>
                    {deviceCoords.lat}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Longitude</span>
                    {deviceCoords.lng}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
                    &plusmn;{deviceCoords.accuracy}m
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {gpsError || 'Please allow browser location permissions to verify attendance.'}
                </div>
              )}

              {/* Proximity / Eligibility Status Box */}
              {currentDistance !== null && (
                <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  isWithinRadius 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {isWithinRadius ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-rose-600" />
                      )}
                      {isWithinRadius ? 'Within Authorized Workplace Area' : 'Outside Authorized Workplace Area'}
                    </span>
                    <span className="font-mono text-xs">
                      {formatDistanceText(currentDistance)} away
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed">
                    {isWithinRadius ? (
                      <>You are <strong>{formatDistanceText(currentDistance)}</strong> from <strong>{selectedWorkplace?.name}</strong>, within the permitted <strong>{permittedRadius}m</strong> boundary. You are eligible to Check In and Check Out.</>
                    ) : (
                      <>You are <strong>{formatDistanceText(currentDistance)}</strong> away, which exceeds the authorized <strong>{permittedRadius}m</strong> boundary by <strong>{formatDistanceText(excessDistance)}</strong>. Check-in is blocked until you are within the workplace area.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mini Interactive Geofence Map */}
          <div className="lg:col-span-5">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <WorkplaceOverviewMap
                workplaces={selectedWorkplace ? [selectedWorkplace] : workplaces}
                selectedWorkplaceId={selectedWorkplace?._id}
                employeeLocation={deviceCoords}
                height="220px"
              />
              <div className="p-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> You
                  <span className="mx-1">&bull;</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Perimeter ({permittedRadius}m)
                </span>
                <span className="font-mono">{deviceCoords ? `Dist: ${formatDistanceText(currentDistance)}` : 'Waiting for GPS'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-800">
              Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Check In: <strong className="text-slate-800">{todayStatus?.checkIn ? new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong></span>
              <span>&bull;</span>
              <span>Check Out: <strong className="text-slate-800">{todayStatus?.checkOut ? new Date(todayStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong></span>
              <span>&bull;</span>
              <span>Work Time: <strong className="text-emerald-700">{todayStatus?.totalWorkMinutes ? `${(todayStatus.totalWorkMinutes / 60).toFixed(1)} hrs` : '0.0 hrs'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!todayStatus?.hasCheckedIn ? (
              <button
                type="button"
                disabled={clocking || (selectedWorkplace?.geofenceEnforced && !isWithinRadius)}
                onClick={() => handleClockAction('in')}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm flex items-center gap-2.5 transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={!isWithinRadius ? 'Move within permitted workplace area to check in' : 'Click to clock in'}
              >
                {clocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                <span>Check In with GPS</span>
              </button>
            ) : !todayStatus?.hasCheckedOut ? (
              <button
                type="button"
                disabled={clocking || (selectedWorkplace?.geofenceEnforced && !isWithinRadius)}
                onClick={() => handleClockAction('out')}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm flex items-center gap-2.5 transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={!isWithinRadius ? 'Move within permitted workplace area to check out' : 'Click to clock out'}
              >
                {clocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                <span>Check Out with GPS</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Attendance Completed for Today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Attendance Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Days Present</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.presentCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">In selected period</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Late Arrivals</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.lateCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Recorded after 09:30 AM</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Work Hours</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.totalWorkHours ?? '0.0'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hours logged</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Daily Average</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.avgDailyHours ?? '0.0'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hours per shift</p>
        </div>
      </div>

      {/* Attendance History & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monthly Attendance History
            </h3>
            <p className="text-xs text-slate-500">
              Detailed chronological attendance records with GPS verification audit
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">GPS Verification</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading records...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => {
                  const checkInDisplay = r.checkIn?.timestamp 
                    ? new Date(r.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : (typeof r.checkIn === 'string' ? r.checkIn : '--:--');

                  const checkOutDisplay = r.checkOut?.timestamp 
                    ? new Date(r.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : (typeof r.checkOut === 'string' ? r.checkOut : '--:--');

                  const hours = r.totalWorkMinutes 
                    ? (r.totalWorkMinutes / 60).toFixed(1) 
                    : (r.workHours || '0.0');

                  const statusBadges = {
                    PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    LATE: 'bg-amber-50 text-amber-700 border-amber-200',
                    ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
                    HALF_DAY: 'bg-blue-50 text-blue-700 border-blue-200'
                  };

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {checkInDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {checkOutDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {hours} hrs
                      </td>
                      <td className="py-3.5 px-4">
                        {r.checkIn?.verificationStatus === 'VERIFIED' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-[11px] font-semibold text-emerald-800">
                              {r.checkIn.workplaceName || 'Authorized Workplace'}
                              {r.checkIn.distanceMeters !== undefined ? ` (${r.checkIn.distanceMeters}m)` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard / VPN</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[r.status] || 'bg-slate-100 text-slate-700'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Requests Status Table */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            My Attendance Correction Requests
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Requested Times</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.date}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {c.requestedCheckIn || '--:--'} &rarr; {c.requestedCheckOut || '--:--'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={c.reason}>
                      {c.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'APPROVED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : c.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Submit Punch Correction
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correction Date
                </label>
                <input
                  type="date"
                  required
                  value={correctionForm.date}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correct Check-In
                  </label>
                  <input
                    type="time"
                    required
                    value={correctionForm.checkInTime}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correct Check-Out
                  </label>
                  <input
                    type="time"
                    required
                    value={correctionForm.checkOutTime}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the automated GPS punch was missed or needs adjustment..."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingCorrection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit to HR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
