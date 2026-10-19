import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Custom icons
const createBranchIcon = (isDefault) => {
  return L.divIcon({
    className: 'custom-branch-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 28px; height: 28px; background: ${isDefault ? '#4f46e5' : '#059669'}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

const createEmployeeUserIcon = () => {
  return L.divIcon({
    className: 'custom-employee-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 18px; height: 18px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

export default function WorkplaceOverviewMap({
  workplaces = [],
  selectedWorkplaceId = null,
  employeeLocation = null, // { lat, lng, accuracy }
  height = '360px',
  onSelectWorkplace,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const employeeMarkerRef = useRef(null);
  const connectionLineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = [37.7749, -122.4194];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Geofences whenever workplaces or employeeLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing branch markers and circles
    markersRef.current.forEach(m => m.remove());
    circlesRef.current.forEach(c => c.remove());
    markersRef.current = [];
    circlesRef.current = [];

    if (connectionLineRef.current) {
      connectionLineRef.current.remove();
      connectionLineRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    // Plot workplaces
    workplaces.forEach((wp) => {
      if (!wp.coordinates || !wp.coordinates.lat || !wp.coordinates.lng) return;

      const pos = [wp.coordinates.lat, wp.coordinates.lng];
      bounds.extend(pos);

      const isSelected = selectedWorkplaceId && wp._id === selectedWorkplaceId;

      // Add Geofence circle
      const circle = L.circle(pos, {
        color: isSelected ? '#4f46e5' : wp.isActive ? '#059669' : '#94a3b8',
        fillColor: isSelected ? '#6366f1' : wp.isActive ? '#10b981' : '#cbd5e1',
        fillOpacity: isSelected ? 0.25 : 0.15,
        weight: isSelected ? 2.5 : 1.5,
        dashArray: isSelected ? '4, 4' : '6, 6',
        radius: Number(wp.radiusMeters) || 100,
      }).addTo(map);

      // Add Marker
      const marker = L.marker(pos, {
        icon: createBranchIcon(wp.isDefault),
      }).addTo(map);

      // Popup
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; min-width: 170px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 2px;">${wp.name}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${wp.code} &bull; ${wp.city || ''}</div>
          <div style="color: #334155; margin-bottom: 6px;">${wp.address}</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
            <span style="background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; border: 1px solid #a7f3d0;">
              Radius: ${wp.radiusMeters}m
            </span>
            ${wp.isDefault ? '<span style="background: #eef2ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; border: 1px solid #c7d2fe;">Primary HQ</span>' : ''}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectWorkplace) onSelectWorkplace(wp);
      });

      markersRef.current.push(marker);
      circlesRef.current.push(circle);
    });

    // Plot employee location if provided
    if (employeeLocation && employeeLocation.lat && employeeLocation.lng) {
      const empPos = [employeeLocation.lat, employeeLocation.lng];
      bounds.extend(empPos);

      if (employeeMarkerRef.current) {
        employeeMarkerRef.current.setLatLng(empPos);
      } else {
        const empMarker = L.marker(empPos, {
          icon: createEmployeeUserIcon(),
        }).addTo(map);
        empMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 700; color: #1d4ed8;">Your Current Position</div>
            <div style="color: #64748b; font-size: 11px;">Accuracy: ±${Math.round(employeeLocation.accuracy || 0)}m</div>
          </div>
        `);
        employeeMarkerRef.current = empMarker;
      }

      // Draw connection line to selected workplace
      const targetWp = workplaces.find(w => w._id === selectedWorkplaceId) || workplaces[0];
      if (targetWp && targetWp.coordinates) {
        const wpPos = [targetWp.coordinates.lat, targetWp.coordinates.lng];
        connectionLineRef.current = L.polyline([empPos, wpPos], {
          color: '#3b82f6',
          weight: 2,
          dashArray: '5, 5',
          opacity: 0.8,
        }).addTo(map);
      }
    } else {
      if (employeeMarkerRef.current) {
        employeeMarkerRef.current.remove();
        employeeMarkerRef.current = null;
      }
    }

    // Fit view to bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [workplaces, selectedWorkplaceId, employeeLocation]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', zIndex: 1 }}
        className="w-full bg-slate-100"
      />
    </div>
  );
}
