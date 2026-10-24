import React, { useState } from 'react';
import { X, Truck, Save, Gauge } from 'lucide-react';

export default function VehicleLogModal({ isOpen, onClose, onSubmit, isSubmitting = false, vehicles = [] }) {
  const defaultVehicles = vehicles?.length ? vehicles : ['CBDP-Honda-003', 'CBDP-Apache-002', 'CBDP-TVS-001', 'CBDP-Auto-004'];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: defaultVehicles[0] || 'CBDP-Honda-003',
    driver: '',
    startKm: 24500,
    endKm: 24620,
    purposeRoute: '',
    fuelLiters: 8.5,
    fuelCost: 1105,
    costPerLiter: 130,
    odometerCheck: 'OK',
    approvedBy: 'Admin',
    remarks: ''
  });

  if (!isOpen) return null;

  const trip = Math.max(0, Number(formData.endKm || 0) - Number(formData.startKm || 0));
  const kmPerL = Number(formData.fuelLiters || 0) > 0 && trip > 0 ? (trip / Number(formData.fuelLiters)).toFixed(2) : 0;
  const costPerKm = trip > 0 && Number(formData.fuelCost || 0) > 0 ? (Number(formData.fuelCost) / trip).toFixed(2) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tripKm: trip,
      kmPerLiter: Number(kmPerL),
      costPerKm: Number(costPerKm)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">New Vehicle Trip & Fuel Log</h2>
              <p className="text-xs text-slate-400">Record mileage, route purpose, and fuel efficiency</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              >
                {defaultVehicles.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Driver</label>
              <input
                type="text"
                required
                placeholder="Driver name"
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-600" /> Mileage & Odometer
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start KM</label>
                <input
                  type="number"
                  min="0"
                  value={formData.startKm}
                  onChange={(e) => setFormData({ ...formData, startKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End KM</label>
                <input
                  type="number"
                  min="0"
                  value={formData.endKm}
                  onChange={(e) => setFormData({ ...formData, endKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Total Trip KM (Auto)</label>
                <div className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold font-mono text-indigo-700">
                  {trip} KM
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Liters</label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.fuelLiters}
                onChange={(e) => setFormData({ ...formData, fuelLiters: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Cost (BDT)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.fuelCost}
                onChange={(e) => setFormData({ ...formData, fuelCost: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Odometer Check</label>
              <select
                value={formData.odometerCheck}
                onChange={(e) => setFormData({ ...formData, odometerCheck: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              >
                <option value="OK">OK</option>
                <option value="Discrepancy">Discrepancy</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Efficiency: </span>
              <span className="font-bold text-indigo-700">{kmPerL} KM/Liter</span>
            </div>
            <div>
              <span className="text-slate-500">Cost Rate: </span>
              <span className="font-bold text-indigo-700">{costPerKm} BDT/KM</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Route Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Barguna to Taltali field office inspection"
              value={formData.purposeRoute}
              onChange={(e) => setFormData({ ...formData, purposeRoute: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
            >
              {isSubmitting ? 'Saving...' : 'Log Trip & Fuel'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
