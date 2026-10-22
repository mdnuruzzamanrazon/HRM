import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, ChevronDown, Check, X, Search, Globe, Building, Compass } from 'lucide-react';
import locationData from '../../data/bangladeshLocations.json';

/**
 * Reusable, High-Performance Bangladesh Administrative Location Selector
 * Supports 4-level cascading: Division -> District (64) -> Upazila (547) -> Union (5,161)
 *
 * Props:
 * - division, district, upazila, union (string values)
 * - onChange: ({ division, district, upazila, union }) => void
 * - isFilterMode: boolean (shows "All Divisions", "All Districts" etc. when true)
 * - disabled: boolean
 * - required: boolean
 * - className: string
 */
export default function LocationSelector({
  division = '',
  district = '',
  upazila = '',
  union = '',
  onChange,
  isFilterMode = false,
  disabled = false,
  required = false,
  layout = 'grid', // 'grid' | 'stack' | 'inline'
}) {
  // Available options based on cascading selections
  const availableDivisions = useMemo(() => {
    return locationData.divisions || [];
  }, []);

  const availableDistricts = useMemo(() => {
    if (!division || division === 'ALL') {
      return Object.keys(locationData.districtUpazilas || {}).sort();
    }
    return locationData.divisionDistricts[division] || [];
  }, [division]);

  const availableUpazilas = useMemo(() => {
    if (!district || district === 'ALL') return [];
    return locationData.districtUpazilas[district] || [];
  }, [district]);

  const availableUnions = useMemo(() => {
    if (!district || district === 'ALL' || !upazila || upazila === 'ALL') return [];
    const upaKey = `${district}__${upazila}`;
    return locationData.upazilaUnions[upaKey] || [];
  }, [district, upazila]);

  // Handlers with automatic resetting of invalid child locations
  const handleDivisionChange = (newDivision) => {
    const nextDiv = newDivision;
    let nextDist = district;
    let nextUpa = upazila;
    let nextUni = union;

    // Check if current district is valid under new division
    if (nextDiv && nextDiv !== 'ALL') {
      const validDists = locationData.divisionDistricts[nextDiv] || [];
      if (!validDists.includes(district)) {
        nextDist = isFilterMode ? 'ALL' : '';
        nextUpa = isFilterMode ? 'ALL' : '';
        nextUni = isFilterMode ? 'ALL' : '';
      }
    }

    onChange({
      division: nextDiv,
      district: nextDist,
      upazila: nextUpa,
      union: nextUni,
    });
  };

  const handleDistrictChange = (newDistrict) => {
    const nextDist = newDistrict;
    let nextDiv = division;
    let nextUpa = '';
    let nextUni = '';

    // Auto-fill division if not selected or mismatched
    if (nextDist && nextDist !== 'ALL') {
      const derivedDiv = locationData.districtToDivision[nextDist];
      if (derivedDiv && (!division || division === 'ALL' || division !== derivedDiv)) {
        nextDiv = derivedDiv;
      }
    }

    if (isFilterMode) {
      nextUpa = 'ALL';
      nextUni = 'ALL';
    }

    onChange({
      division: nextDiv,
      district: nextDist,
      upazila: nextUpa,
      union: nextUni,
    });
  };

  const handleUpazilaChange = (newUpazila) => {
    onChange({
      division,
      district,
      upazila: newUpazila,
      union: isFilterMode ? 'ALL' : '',
    });
  };

  const handleUnionChange = (newUnion) => {
    onChange({
      division,
      district,
      upazila,
      union: newUnion,
    });
  };

  const handleClearAll = (e) => {
    e.preventDefault();
    onChange({
      division: isFilterMode ? 'ALL' : '',
      district: isFilterMode ? 'ALL' : '',
      upazila: isFilterMode ? 'ALL' : '',
      union: isFilterMode ? 'ALL' : '',
    });
  };

  const hasAnySelection = (division && division !== 'ALL') || (district && district !== 'ALL');

  return (
    <div className="space-y-2">
      {/* Location Level Badges / Clear Helper */}
      {!isFilterMode && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>Administrative Location (Bangladesh)</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {hasAnySelection && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
            >
              Reset Locations
            </button>
          )}
        </div>
      )}

      {/* Grid Inputs */}
      <div className={`grid gap-2.5 ${
        layout === 'stack' 
          ? 'grid-cols-1' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        
        {/* 1. DIVISION */}
        <div>
          {isFilterMode && (
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              1. Division
            </label>
          )}
          <div className="relative">
            <select
              value={division || (isFilterMode ? 'ALL' : '')}
              onChange={(e) => handleDivisionChange(e.target.value)}
              disabled={disabled}
              className={`w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-slate-800 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer appearance-none truncate ${
                division && division !== 'ALL' ? 'border-indigo-400 bg-indigo-50/20' : ''
              }`}
            >
              {isFilterMode ? (
                <option value="ALL">Division: All (8)</option>
              ) : (
                <option value="">Select Division *</option>
              )}
              {availableDivisions.map((div) => (
                <option key={div} value={div}>
                  {div} Division
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 2. DISTRICT */}
        <div>
          {isFilterMode && (
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              2. District
            </label>
          )}
          <div className="relative">
            <select
              value={district || (isFilterMode ? 'ALL' : '')}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={disabled || (!division && !isFilterMode)}
              className={`w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-slate-800 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer appearance-none truncate ${
                district && district !== 'ALL' ? 'border-indigo-400 bg-indigo-50/20' : ''
              }`}
            >
              {isFilterMode ? (
                <option value="ALL">
                  District: All ({availableDistricts.length})
                </option>
              ) : (
                <option value="">
                  {division ? `Select District (${availableDistricts.length}) *` : 'Select Division first'}
                </option>
              )}
              {availableDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. UPAZILA */}
        <div>
          {isFilterMode && (
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              3. Upazila / Thana
            </label>
          )}
          <div className="relative">
            <select
              value={upazila || (isFilterMode ? 'ALL' : '')}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              disabled={disabled || !district || district === 'ALL'}
              className={`w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-slate-800 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer appearance-none truncate ${
                upazila && upazila !== 'ALL' ? 'border-indigo-400 bg-indigo-50/20' : ''
              }`}
            >
              {isFilterMode ? (
                <option value="ALL">
                  {district && district !== 'ALL'
                    ? `Upazila: All (${availableUpazilas.length})`
                    : 'Upazila: All'}
                </option>
              ) : (
                <option value="">
                  {district && district !== 'ALL'
                    ? `Select Upazila (${availableUpazilas.length})`
                    : 'Select District first'}
                </option>
              )}
              {availableUpazilas.map((upa) => (
                <option key={upa} value={upa}>
                  {upa}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 4. UNION */}
        <div>
          {isFilterMode && (
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              4. Union / Ward
            </label>
          )}
          <div className="relative">
            <select
              value={union || (isFilterMode ? 'ALL' : '')}
              onChange={(e) => handleUnionChange(e.target.value)}
              disabled={disabled || !upazila || upazila === 'ALL'}
              className={`w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-slate-800 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer appearance-none truncate ${
                union && union !== 'ALL' ? 'border-indigo-400 bg-indigo-50/20' : ''
              }`}
            >
              {isFilterMode ? (
                <option value="ALL">
                  {upazila && upazila !== 'ALL'
                    ? `Union: All (${availableUnions.length})`
                    : 'Union: All'}
                </option>
              ) : (
                <option value="">
                  {upazila && upazila !== 'ALL'
                    ? `Select Union (${availableUnions.length})`
                    : 'Select Upazila first'}
                </option>
              )}
              {availableUnions.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Selected Breadcrumb Path Pill */}
      {hasAnySelection && !isFilterMode && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
          <MapPin className="w-3 h-3 text-indigo-600 flex-shrink-0" />
          <span className="font-bold text-slate-900">{division || '—'} Division</span>
          <span>&gt;</span>
          <span className="font-semibold text-slate-800">{district || 'All Districts'}</span>
          {upazila && (
            <>
              <span>&gt;</span>
              <span className="text-slate-700">{upazila}</span>
            </>
          )}
          {union && (
            <>
              <span>&gt;</span>
              <span className="text-indigo-700 font-bold">{union}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
