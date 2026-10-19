import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Search, MapPin, Crosshair, Navigation, AlertCircle, Loader2, 
  Layers, Key, Check, Globe, ExternalLink, HelpCircle, Compass,
  Info, Sparkles, Map as MapIcon, X, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { parseLocationInput, sanitizeCoordinates, isReversedCoordinates } from '../../utils/geoParser';
import api from '../../services/api';

// Pixel-perfect SVG Pin Marker for Leaflet
const createWorkplacePinIcon = () => {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="position: relative; width: 36px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); cursor: grab;">
        <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#047857" />
            </linearGradient>
          </defs>
          <!-- Pin Body -->
          <path d="M18 0C8.05887 0 0 8.05887 0 18C0 27.5 14.5 39.5 17.15 41.6C17.65 42 18.35 42 18.85 41.6C21.5 39.5 36 27.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="url(#pinGrad)"/>
          <!-- Inner Circle -->
          <circle cx="18" cy="18" r="7.5" fill="#ffffff"/>
          <circle cx="18" cy="18" r="4.5" fill="#047857"/>
        </svg>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42], // Exact bottom tip points to the target coordinate!
    popupAnchor: [0, -42],
  });
};

export default function LocationPickerMap({
  lat = 37.774929,
  lng = -122.419416,
  radiusMeters = 100,
  onChange,
  readOnly = false,
  height = '380px',
}) {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const reverseGeocodeTimerRef = useRef(null);
  const isInternalInteractionRef = useRef(false);

  // Leaflet references
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);
  const leafletCircleRef = useRef(null);
  const leafletAccuracyCircleRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Google Maps references
  const gmapInstanceRef = useRef(null);
  const gmarkerRef = useRef(null);
  const gcircleRef = useRef(null);
  const gaccuracyCircleRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Engine state: 'google' | 'leaflet'
  const [mapEngine, setMapEngine] = useState('leaflet');
  const [satelliteMode, setSatelliteMode] = useState(false);

  // Google Maps API Key handling
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('GOOGLE_MAPS_API_KEY') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // Location & Accuracy State
  const [gpsAccuracy, setGpsAccuracy] = useState(null); // accuracy in meters
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '', details: '' });

  // Search & Places Suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Clean up all map instances
  const cleanupMaps = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
    if (gmapInstanceRef.current) {
      gmapInstanceRef.current = null;
    }
  };

  // Perform reverse geocoding with debounce to prevent rate-limiting
  const scheduleReverseGeocode = useCallback((targetLat, targetLng) => {
    if (reverseGeocodeTimerRef.current) {
      clearTimeout(reverseGeocodeTimerRef.current);
    }

    reverseGeocodeTimerRef.current = setTimeout(async () => {
      try {
        setIsGeocoding(true);

        // 1. If Google Maps Engine is active with Geocoder
        if (mapEngine === 'google' && window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: targetLat, lng: targetLng } }, (results, status) => {
            setIsGeocoding(false);
            if (status === 'OK' && results && results[0]) {
              const formatted = results[0].formatted_address;
              let city = '';
              let country = '';
              results[0].address_components?.forEach((comp) => {
                if (comp.types.includes('locality')) city = comp.long_name;
                if (comp.types.includes('country')) country = comp.long_name;
              });

              if (onChange) {
                onChange({
                  lat: targetLat,
                  lng: targetLng,
                  radiusMeters,
                  address: formatted,
                  city,
                  country,
                });
              }
              setStatusMessage({
                text: `Pinpoint identified: ${formatted}`,
                type: 'success',
              });
            }
          });
          return;
        }

        // 2. OpenStreetMap / Nominatim Reverse Geocoder fallback
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setIsGeocoding(false);

        if (data && data.display_name) {
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
          const country = data.address?.country || '';

          if (onChange) {
            onChange({
              lat: targetLat,
              lng: targetLng,
              radiusMeters,
              address: data.display_name,
              city,
              country,
            });
          }
          setStatusMessage({
            text: `Pinpoint identified: ${data.display_name}`,
            type: 'success',
          });
        }
      } catch (err) {
        console.warn('Reverse geocoding notice:', err.message);
        setIsGeocoding(false);
      }
    }, 350);
  }, [mapEngine, radiusMeters, onChange]);

  // Coordinate change handler triggered by user interaction
  const handleCoordinateSelect = useCallback((newLat, newLng, immediateReverseGeocode = true) => {
    isInternalInteractionRef.current = true;
    const sanitized = sanitizeCoordinates(newLat, newLng);
    if (!sanitized) return;

    const finalLat = sanitized.lat;
    const finalLng = sanitized.lng;

    // 1. Immediately inform parent so form coordinates update synchronously
    if (onChange) {
      onChange({
        lat: finalLat,
        lng: finalLng,
        radiusMeters,
      });
    }

    // 2. Schedule reverse geocode to update address fields
    if (immediateReverseGeocode) {
      scheduleReverseGeocode(finalLat, finalLng);
    }

    setTimeout(() => {
      isInternalInteractionRef.current = false;
    }, 150);
  }, [onChange, radiusMeters, scheduleReverseGeocode]);

  // Initialize Google Maps Engine
  const initGoogleMap = useCallback(() => {
    if (!window.google?.maps || !mapContainerRef.current) return;
    cleanupMaps();

    try {
      const center = { lat: Number(lat) || 37.774929, lng: Number(lng) || -122.419416 };
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 17,
        mapTypeId: satelliteMode ? 'hybrid' : 'roadmap',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: !readOnly,
        title: 'Workplace Location (Drag to pinpoint exact facility entrance)',
        animation: window.google.maps.Animation.DROP,
      });

      const circle = new window.google.maps.Circle({
        strokeColor: '#059669',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.22,
        map,
        center,
        radius: Number(radiusMeters) || 100,
      });

      // Drag listener
      if (!readOnly) {
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          const newLat = Number(pos.lat().toFixed(6));
          const newLng = Number(pos.lng().toFixed(6));
          circle.setCenter(pos);
          handleCoordinateSelect(newLat, newLng);
        });

        // Click listener on map canvas
        map.addListener('click', (e) => {
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition(e.latLng);
          circle.setCenter(e.latLng);
          handleCoordinateSelect(newLat, newLng);
        });

        // Google Places Autocomplete Integration
        if (searchInputRef.current && window.google.maps.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          });
          autocomplete.bindTo('bounds', map);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              setStatusMessage({
                text: 'Location details unavailable for this place. Please select from the dropdown.',
                type: 'error',
              });
              return;
            }

            const newLat = Number(place.geometry.location.lat().toFixed(6));
            const newLng = Number(place.geometry.location.lng().toFixed(6));
            map.setCenter(place.geometry.location);
            map.setZoom(18);
            marker.setPosition(place.geometry.location);
            circle.setCenter(place.geometry.location);

            let city = '';
            let country = '';
            place.address_components?.forEach((comp) => {
              if (comp.types.includes('locality')) city = comp.long_name;
              if (comp.types.includes('country')) country = comp.long_name;
            });

            if (onChange) {
              onChange({
                lat: newLat,
                lng: newLng,
                radiusMeters,
                name: place.name || '',
                address: place.formatted_address || '',
                city,
                country,
              });
            }
            setStatusMessage({
              text: `Located: ${place.name || place.formatted_address}`,
              type: 'success',
            });
          });
          autocompleteRef.current = autocomplete;
        }
      }

      gmapInstanceRef.current = map;
      gmarkerRef.current = marker;
      gcircleRef.current = circle;
      setMapEngine('google');
      setStatusMessage({ text: 'Google Maps Engine Active with Places Autocomplete', type: 'info' });
    } catch (err) {
      console.error('Failed to init Google Maps:', err);
      initLeafletMap();
    }
  }, [lat, lng, radiusMeters, readOnly, satelliteMode, handleCoordinateSelect, onChange]);

  // Initialize Leaflet Engine (OpenStreetMap + High-Res Satellite)
  const initLeafletMap = useCallback(() => {
    if (!mapContainerRef.current) return;
    cleanupMaps();

    const initialLat = Number(lat) || 37.774929;
    const initialLng = Number(lng) || -122.419416;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: true,
      attributionControl: false,
    });

    const streetLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const satelliteLayer = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const tileLayer = L.tileLayer(satelliteMode ? satelliteLayer : streetLayer, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors / Esri Satellite',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Permitted Radius Circle
    const circle = L.circle([initialLat, initialLng], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.22,
      weight: 2,
      dashArray: '6, 6',
      radius: Number(radiusMeters) || 100,
    }).addTo(map);
    leafletCircleRef.current = circle;

    // Pinpoint Marker with bottom tip anchor
    const marker = L.marker([initialLat, initialLng], {
      icon: createWorkplacePinIcon(),
      draggable: !readOnly,
      autoPan: true,
    }).addTo(map);
    leafletMarkerRef.current = marker;

    if (!readOnly) {
      // Dragging marker
      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        const newLat = Number(newPos.lat.toFixed(6));
        const newLng = Number(newPos.lng.toFixed(6));
        circle.setLatLng(newPos);
        handleCoordinateSelect(newLat, newLng);
      });

      // Clicking directly on the map
      map.on('click', (e) => {
        // Ensure map bounds are completely up-to-date
        map.invalidateSize({ pan: false });
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng(e.latlng);
        circle.setLatLng(e.latlng);
        handleCoordinateSelect(newLat, newLng);
      });
    }

    leafletMapRef.current = map;
    setMapEngine('leaflet');

    // Staggered size invalidation to resolve modal rendering animations
    setTimeout(() => map.invalidateSize(), 80);
    setTimeout(() => map.invalidateSize(), 250);
    setTimeout(() => map.invalidateSize(), 500);
  }, [lat, lng, radiusMeters, readOnly, satelliteMode, handleCoordinateSelect]);

  // Load Google Maps SDK or fallback to Leaflet
  useEffect(() => {
    // Setup window.gm_authFailure handler to prevent freezing on invalid keys
    window.gm_authFailure = () => {
      console.warn('Google Maps API key authorization failed. Falling back to OpenStreetMap / Satellite view.');
      setStatusMessage({
        text: 'Google Maps API authorization failed (check API key restrictions/billing). Automatically switched to High-Resolution Satellite & OpenStreetMap engine.',
        type: 'error',
      });
      initLeafletMap();
    };

    if (apiKey && apiKey.trim().length > 10) {
      if (window.google?.maps) {
        initGoogleMap();
        return;
      }
      const existing = document.getElementById('google-maps-sdk');
      if (existing) {
        existing.addEventListener('load', initGoogleMap);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey.trim()}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleMap();
      script.onerror = () => {
        console.warn('Google Maps SDK failed to load. Falling back to OpenStreetMap / Satellite view.');
        setStatusMessage({
          text: 'Google Maps connection issue. High-resolution OpenStreetMap engine active.',
          type: 'info',
        });
        initLeafletMap();
      };
      document.head.appendChild(script);
    } else {
      initLeafletMap();
    }

    return () => {
      cleanupMaps();
      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
      }
    };
  }, [apiKey]);

  // ResizeObserver: auto-adjust map bounds when modal or window resizes
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize({ pan: false });
      }
      if (gmapInstanceRef.current && window.google?.maps) {
        window.google.maps.event.trigger(gmapInstanceRef.current, 'resize');
      }
    };

    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserverRef.current.observe(mapContainerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Synchronize External Coordinates & Radius with Map & Center
  useEffect(() => {
    if (isInternalInteractionRef.current) return;

    const nLat = Number(lat);
    const nLng = Number(lng);
    const nRadius = Number(radiusMeters);
    if (isNaN(nLat) || isNaN(nLng)) return;

    if (mapEngine === 'google' && gmarkerRef.current && gcircleRef.current) {
      const pos = { lat: nLat, lng: nLng };
      gmarkerRef.current.setPosition(pos);
      gcircleRef.current.setCenter(pos);
      if (!isNaN(nRadius) && nRadius >= 10) {
        gcircleRef.current.setRadius(nRadius);
      }
      // Pan map if distance from center is significant
      if (gmapInstanceRef.current) {
        const center = gmapInstanceRef.current.getCenter();
        if (center && (Math.abs(center.lat() - nLat) > 0.0005 || Math.abs(center.lng() - nLng) > 0.0005)) {
          gmapInstanceRef.current.panTo(pos);
        }
      }
    } else if (leafletMarkerRef.current && leafletCircleRef.current) {
      leafletMarkerRef.current.setLatLng([nLat, nLng]);
      leafletCircleRef.current.setLatLng([nLat, nLng]);
      if (!isNaN(nRadius) && nRadius >= 10) {
        leafletCircleRef.current.setRadius(nRadius);
      }
      // Pan map if distance from center is significant
      if (leafletMapRef.current) {
        const center = leafletMapRef.current.getCenter();
        if (center && (Math.abs(center.lat - nLat) > 0.0005 || Math.abs(center.lng - nLng) > 0.0005)) {
          leafletMapRef.current.panTo([nLat, nLng]);
        }
      }
    }
  }, [lat, lng, radiusMeters, mapEngine]);

  // Toggle Satellite View
  const toggleSatellite = () => {
    const nextMode = !satelliteMode;
    setSatelliteMode(nextMode);

    if (mapEngine === 'google' && gmapInstanceRef.current) {
      gmapInstanceRef.current.setMapTypeId(nextMode ? 'hybrid' : 'roadmap');
    } else if (mapEngine === 'leaflet' && tileLayerRef.current) {
      const streetLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const satelliteLayer = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      tileLayerRef.current.setUrl(nextMode ? satelliteLayer : streetLayer);
    }
  };

  // "Use My Current Location" with high-accuracy GPS & uncertainty visualization
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage({
        text: 'Geolocation is not supported by your current browser.',
        type: 'error',
      });
      return;
    }

    setIsLocating(true);
    setStatusMessage({
      text: 'Acquiring high-accuracy GPS fix from device hardware...',
      type: 'info',
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy || 0);
        const myLat = Number(pos.coords.latitude.toFixed(6));
        const myLng = Number(pos.coords.longitude.toFixed(6));
        setGpsAccuracy(accuracy);

        // Update map position and zoom in
        if (mapEngine === 'google' && gmapInstanceRef.current) {
          const loc = { lat: myLat, lng: myLng };
          gmapInstanceRef.current.panTo(loc);
          gmapInstanceRef.current.setZoom(18);
          gmarkerRef.current?.setPosition(loc);
          gcircleRef.current?.setCenter(loc);

          // Accuracy aura circle
          if (gaccuracyCircleRef.current) gaccuracyCircleRef.current.setMap(null);
          gaccuracyCircleRef.current = new window.google.maps.Circle({
            strokeColor: '#3b82f6',
            strokeOpacity: 0.6,
            strokeWeight: 1.5,
            fillColor: '#60a5fa',
            fillOpacity: 0.15,
            map: gmapInstanceRef.current,
            center: loc,
            radius: accuracy,
          });
        } else if (leafletMapRef.current) {
          leafletMapRef.current.setView([myLat, myLng], 18, { animate: true });
          leafletMarkerRef.current?.setLatLng([myLat, myLng]);
          leafletCircleRef.current?.setLatLng([myLat, myLng]);

          if (leafletAccuracyCircleRef.current) {
            leafletAccuracyCircleRef.current.remove();
          }
          leafletAccuracyCircleRef.current = L.circle([myLat, myLng], {
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.15,
            weight: 1.5,
            radius: accuracy,
          }).addTo(leafletMapRef.current);
        }

        handleCoordinateSelect(myLat, myLng);
        setIsLocating(false);

        const accuracyLevel = accuracy <= 25 
          ? 'High-Precision GPS Hardware' 
          : accuracy <= 150 
          ? 'Wi-Fi / Cellular Positioning' 
          : 'Approximate Location';

        setStatusMessage({
          text: `Current location detected! GPS Accuracy: ±${accuracy}m (${accuracyLevel}). You can drag the pin to pinpoint the exact building entrance.`,
          type: accuracy > 150 ? 'warning' : 'success',
        });
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setStatusMessage({
            text: 'Location permission was denied. Please allow location access in your browser address bar settings to detect your current position.',
            type: 'error',
          });
        } else if (err.code === 2) {
          setStatusMessage({
            text: 'GPS position unavailable. Please ensure device location / Wi-Fi positioning is enabled.',
            type: 'error',
          });
        } else {
          setStatusMessage({
            text: 'Location request timed out. Please try clicking directly on the map or searching for the address.',
            type: 'error',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Live Address Query Suggestions (Nominatim OpenStreetMap)
  useEffect(() => {
    if (mapEngine === 'google' || !searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const encoded = encodeURIComponent(searchQuery.trim());
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (e) {
        console.warn('Address search suggestion error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, mapEngine]);

  // Select Suggestion
  const handleSelectSuggestion = (item) => {
    const newLat = Number(parseFloat(item.lat).toFixed(6));
    const newLng = Number(parseFloat(item.lon).toFixed(6));
    setShowSuggestions(false);
    setSearchQuery(item.display_name);

    if (leafletMapRef.current && leafletMarkerRef.current) {
      leafletMarkerRef.current.setLatLng([newLat, newLng]);
      leafletCircleRef.current?.setLatLng([newLat, newLng]);
      leafletMapRef.current.setView([newLat, newLng], 18, { animate: true });
    }

    const city = item.address?.city || item.address?.town || item.address?.village || '';
    const country = item.address?.country || '';

    if (onChange) {
      onChange({
        lat: newLat,
        lng: newLng,
        radiusMeters,
        address: item.display_name,
        city,
        country,
      });
    }

    setStatusMessage({ text: `Selected: ${item.display_name}`, type: 'success' });
  };

  // Submit Search / Google Maps URL / Raw Coordinates
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;

    // Check if Google Maps link or coordinates
    const parsed = parseLocationInput(searchQuery);
    if (parsed) {
      const { lat: pLat, lng: pLng, wasSwapped } = parsed;
      if (mapEngine === 'google' && gmapInstanceRef.current && gmarkerRef.current) {
        const loc = { lat: pLat, lng: pLng };
        gmarkerRef.current.setPosition(loc);
        gcircleRef.current?.setCenter(loc);
        gmapInstanceRef.current.panTo(loc);
        gmapInstanceRef.current.setZoom(18);
      } else if (leafletMapRef.current && leafletMarkerRef.current) {
        leafletMarkerRef.current.setLatLng([pLat, pLng]);
        leafletCircleRef.current?.setLatLng([pLat, pLng]);
        leafletMapRef.current.setView([pLat, pLng], 18, { animate: true });
      }

      handleCoordinateSelect(pLat, pLng);
      setShowSuggestions(false);
      setStatusMessage({
        text: wasSwapped 
          ? `Parsed coordinates (${pLat}, ${pLng}) with automatic latitude/longitude reversal correction.`
          : `Extracted location: ${pLat}, ${pLng}`,
        type: 'success',
      });
      return;
    }

    // If query is a URL (e.g. maps.app.goo.gl, goo.gl, or full link)
    if (searchQuery.includes('http://') || searchQuery.includes('https://') || searchQuery.includes('goo.gl')) {
      try {
        setIsSearching(true);
        setStatusMessage({ text: 'Resolving Google Maps shortlink and identifying office location...', type: 'info' });
        const res = await api.get(`/api/v1/workplaces/resolve-link?url=${encodeURIComponent(searchQuery.trim())}`);
        setIsSearching(false);
        if (res.data?.success && res.data.data) {
          const { lat: pLat, lng: pLng, address, city, country } = res.data.data;
          if (mapEngine === 'google' && gmapInstanceRef.current && gmarkerRef.current) {
            const loc = { lat: pLat, lng: pLng };
            gmarkerRef.current.setPosition(loc);
            gcircleRef.current?.setCenter(loc);
            gmapInstanceRef.current.panTo(loc);
            gmapInstanceRef.current.setZoom(18);
          } else if (leafletMapRef.current && leafletMarkerRef.current) {
            leafletMarkerRef.current.setLatLng([pLat, pLng]);
            leafletCircleRef.current?.setLatLng([pLat, pLng]);
            leafletMapRef.current.setView([pLat, pLng], 18, { animate: true });
          }

          handleCoordinateSelect(pLat, pLng);
          setShowSuggestions(false);
          if (onChange) {
            onChange({
              lat: pLat,
              lng: pLng,
              radiusMeters,
              address: address || '',
              city: city || '',
              country: country || '',
            });
          }
          setStatusMessage({
            text: `Identified location: ${address || `${pLat}, ${pLng}`}`,
            type: 'success',
          });
          return;
        }
      } catch (err) {
        setIsSearching(false);
        setStatusMessage({
          text: err.response?.data?.message || 'Could not resolve Google Maps shortlink. Please verify the URL.',
          type: 'error',
        });
        return;
      }
    }

    // If suggestions available, select the first
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  // Save Google Maps Key
  const handleSaveApiKey = () => {
    const trimmed = tempKey.trim();
    if (trimmed) {
      localStorage.setItem('GOOGLE_MAPS_API_KEY', trimmed);
      setApiKey(trimmed);
      setShowKeyModal(false);
      setStatusMessage({ text: 'Google Maps API Key saved! Loading Google Maps Engine...', type: 'info' });
    } else {
      localStorage.removeItem('GOOGLE_MAPS_API_KEY');
      setApiKey('');
      setShowKeyModal(false);
      initLeafletMap();
      setStatusMessage({ text: 'Switched to High-Resolution Satellite & OpenStreetMap engine.', type: 'info' });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white">
      {/* Top Interactive Toolbar */}
      {!readOnly && (
        <div className="p-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Box / Places Autocomplete (DIV container, NOT form, to prevent nested form bugs!) */}
          <div className="relative flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={mapEngine === 'google' ? "Search places with Google Places Autocomplete..." : "Search address, landmark, or paste Google Maps link..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearchSubmit();
                    }
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all font-medium"
                />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Locate
              </button>
            </div>

            {/* Suggestions Dropdown (Nominatim/OSM mode) */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-2.5 hover:bg-emerald-50 cursor-pointer text-xs text-slate-700 flex items-start gap-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">{item.name || item.display_name?.split(',')[0]}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.display_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons: "Use My Current Location", Satellite Toggle, Google Key */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Prominent Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Detect device GPS coordinates and center map"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Compass className="w-4 h-4 text-emerald-600" />
              )}
              <span>Use My Current Location</span>
            </button>

            {/* Satellite / Roadmap Toggle */}
            <button
              type="button"
              onClick={toggleSatellite}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                satelliteMode 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Toggle between Street Map and High-Res Satellite View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{satelliteMode ? 'Satellite View' : 'Roadmap'}</span>
            </button>

            {/* Google Maps API Key Config */}
            <button
              type="button"
              onClick={() => {
                setTempKey(apiKey);
                setShowKeyModal(true);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                mapEngine === 'google'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Configure Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{mapEngine === 'google' ? 'Google Maps Active' : 'Google API Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Accuracy & Location Feedback Alerts */}
      {statusMessage.text && (
        <div className={`px-3.5 py-2 text-xs flex items-center justify-between border-b ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : statusMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : statusMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : statusMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium leading-snug">{statusMessage.text}</span>
          </div>
          <button 
            type="button"
            onClick={() => setStatusMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-700 text-sm ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', zIndex: 1 }}
        className="w-full bg-slate-100 cursor-crosshair"
      />

      {/* Bottom Floating Status Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Selected Pinpoint:
          </span>
          <span className="font-mono bg-white px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold text-slate-900 shadow-2xs">
            {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          </span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            Geofence Radius:
          </span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
            {radiusMeters} meters
          </span>

          {/* GPS Accuracy Indicator */}
          {gpsAccuracy !== null && (
            <>
              <span className="text-slate-300">|</span>
              <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border ${
                gpsAccuracy <= 25 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : gpsAccuracy <= 150 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <Crosshair className="w-3 h-3" />
                GPS Accuracy: &plusmn;{gpsAccuracy}m {gpsAccuracy <= 25 ? '(High Precision)' : '(Estimated)'}
              </span>
            </>
          )}

          {isGeocoding && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Resolving address...
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          <span className="text-slate-400">Engine:</span> {mapEngine === 'google' ? 'Google Maps JS API' : 'OpenStreetMap & High-Res Satellite'}
        </div>
      </div>

      {/* Google Maps API Key Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-modal-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                Google Maps JavaScript & Places API Key
              </h4>
              <button type="button" onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              To use authentic Google Maps with Google Places Autocomplete and Street View, paste your Google Maps API key below. You can also configure it in <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">.env</code> as <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Key (starts with AIzaSy...)
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Leave empty to use the built-in high-resolution OpenStreetMap & Satellite aerial imagery engine (free, zero API key required).
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                Apply Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
