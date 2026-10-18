import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, Clock, ShieldCheck, Sun, Moon, 
  Coffee, AlertCircle, Loader2, CheckCircle2, UserCheck,
  Info, Compass
} from 'lucide-react';

export default function EmployeeShifts() {
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShift();
  }, []);

  const fetchShift = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shifts/my');
      if (res.data?.success) {
        setShiftData(res.data.data?.shift || null);
      }
    } catch (err) {
      console.error('Error fetching shift:', err);
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const activeDays = shiftData?.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const startTime = shiftData?.startTime || '09:00';
  const endTime = shiftData?.endTime || '17:00';
  const shiftName = shiftData?.name || 'Standard Morning Shift';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Work Schedule & Shift Timings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            View your official roster assignment, expected working hours, and company attendance policies
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          Loading your shift assignment...
        </div>
      ) : (
        <>
          {/* Active Shift Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  Active Assigned Schedule
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{shiftName}</h3>
                <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                  Your regular scheduled hours as approved by your departmental manager and recorded by the HR system.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex items-center gap-6 self-start md:self-auto">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">Start Time</span>
                  <span className="text-xl font-black font-mono">{startTime}</span>
                </div>
                <div className="text-emerald-300 font-bold">&ndash;</div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">End Time</span>
                  <span className="text-xl font-black font-mono">{endTime}</span>
                </div>
                <div className="border-l border-white/20 pl-6 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">Daily Target</span>
                  <span className="text-xl font-black">8.0 hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Timetable Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Work Schedule</h3>
                <p className="text-[11px] text-slate-400">Regular recurring 7-day roster breakdown</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {daysOfWeek.map((day) => {
                const isWorkDay = activeDays.includes(day);
                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isWorkDay
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        : 'bg-slate-50/80 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold">{day.slice(0, 3)}</span>
                        {isWorkDay ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Off</span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {isWorkDay ? `${startTime} - ${endTime}` : 'Weekend / Rest'}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200/50 text-[10px]">
                      {isWorkDay ? (
                        <span className="text-emerald-700 font-bold">8h 00m Expected</span>
                      ) : (
                        <span className="text-slate-400">Rest Day</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shift Rules & Policies */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Late Arrival Grace Period</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                A 15-minute grace window is permitted in the morning. Check-ins after 09:15 AM are automatically flagged as late arrivals.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Lunch & Rest Breaks</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Standard 60-minute unpaid lunch break scheduled between 12:30 PM &ndash; 02:00 PM. Two 15-minute coffee pauses are permitted.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Shift Change Inquiries</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Need to swap shifts or request flexible arrangements? Contact your HR business partner or department lead at least 48 hours in advance.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
