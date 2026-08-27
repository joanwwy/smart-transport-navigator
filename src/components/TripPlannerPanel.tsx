import React, { useState, useRef, useEffect } from 'react';
import { TransportMode, ScheduleType, PlaceItem } from '../types';
import { POPULAR_PLACES } from '../data/mockTransitData';

interface TripPlannerPanelProps {
  origin: string;
  destination: string;
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onSwapLocations: () => void;
  scheduleType: ScheduleType;
  onScheduleTypeChange: (type: ScheduleType) => void;
  dateString: string;
  timeString: string;
  onDateTimeChange: (date: string, time: string) => void;
  transportMode: TransportMode;
  onTransportModeChange: (mode: TransportMode) => void;
  onPlanRoute: () => void;
  isPlanning: boolean;
}

export const TripPlannerPanel: React.FC<TripPlannerPanelProps> = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSwapLocations,
  scheduleType,
  onScheduleTypeChange,
  dateString,
  timeString,
  onDateTimeChange,
  transportMode,
  onTransportModeChange,
  onPlanRoute,
  isPlanning,
}) => {
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'rain'>('sunny');
  const [showWeatherDetail, setShowWeatherDetail] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Live OneMap search suggestions state
  const [originSearchResults, setOriginSearchResults] = useState<PlaceItem[]>([]);
  const [destSearchResults, setDestSearchResults] = useState<PlaceItem[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#origin-container')) setShowOriginDropdown(false);
      if (!target.closest('#dest-container')) setShowDestDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced OneMap Elastic Search for Origin
  useEffect(() => {
    if (!origin.trim() || origin === 'Current Location' || origin.length < 2) {
      setOriginSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      try {
        const res = await fetch(`/api/onemap/search?searchVal=${encodeURIComponent(origin.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            const mapped: PlaceItem[] = data.results.slice(0, 6).map((item: any, idx: number) => ({
              id: `om-orig-${idx}`,
              name: item.SEARCHVAL || item.BUILDING || item.ADDRESS,
              code: item.POSTAL ? `S(${item.POSTAL})` : 'OneMap',
              category: 'station',
              address: item.ADDRESS || item.ROAD_NAME,
            }));
            setOriginSearchResults(mapped);
          }
        }
      } catch {
        // Fallback to local
      } finally {
        setIsSearchingOrigin(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [origin]);

  // Debounced OneMap Elastic Search for Destination
  useEffect(() => {
    if (!destination.trim() || destination.length < 2) {
      setDestSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const res = await fetch(`/api/onemap/search?searchVal=${encodeURIComponent(destination.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            const mapped: PlaceItem[] = data.results.slice(0, 6).map((item: any, idx: number) => ({
              id: `om-dest-${idx}`,
              name: item.SEARCHVAL || item.BUILDING || item.ADDRESS,
              code: item.POSTAL ? `S(${item.POSTAL})` : 'OneMap',
              category: 'landmark',
              address: item.ADDRESS || item.ROAD_NAME,
            }));
            setDestSearchResults(mapped);
          }
        }
      } catch {
        // Fallback to local
      } finally {
        setIsSearchingDest(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destination]);

  // GPS Current Location Resolver (Browser Geolocation + OneMap Reverse Geocode)
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      onOriginChange('Current Location (Singapore)');
      setLocationStatus('GPS not supported in browser');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Locating current GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Attempt reverse geocoding via OneMap
          const res = await fetch(`/api/onemap/revgeocode?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.GeocodeInfo && data.GeocodeInfo[0]) {
              const info = data.GeocodeInfo[0];
              const resolvedName = info.BUILDINGNAME || info.ROAD || `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
              onOriginChange(resolvedName);
              setLocationStatus(null);
              setIsLocating(false);
              return;
            }
          }
        } catch {
          // fallback
        }
        onOriginChange(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setLocationStatus(null);
        setIsLocating(false);
      },
      (_err) => {
        // Fallback to preset default GPS
        onOriginChange('Current Location (Toa Payoh Central)');
        setLocationStatus('Using estimated location (Toa Payoh)');
        setTimeout(() => setLocationStatus(null), 3000);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const filteredLocalOriginPlaces = POPULAR_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(origin.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(origin.toLowerCase()))
  );

  const filteredLocalDestPlaces = POPULAR_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(destination.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(destination.toLowerCase()))
  );

  const displayedOriginPlaces = originSearchResults.length > 0 ? originSearchResults : filteredLocalOriginPlaces;
  const displayedDestPlaces = destSearchResults.length > 0 ? destSearchResults : filteredLocalDestPlaces;

  return (
    <aside className="w-full md:w-4/12 bg-[#f7f2f8] p-4 md:p-6 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-[#c1c6d3] overflow-y-auto shrink-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-[32px] font-bold text-[#1c1b1f] tracking-tight leading-tight">
          Trip Planner
        </h1>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isLocating}
          title="Detect Current GPS Location"
          className="flex items-center gap-1 text-xs font-semibold text-[#004481] hover:bg-[#d5e3ff]/50 px-2 py-1 rounded-md border border-[#c1c6d3] transition-colors cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[16px] ${isLocating ? 'animate-spin' : ''}`}>
            {isLocating ? 'sync' : 'my_location'}
          </span>
          <span>{isLocating ? 'Locating...' : 'GPS'}</span>
        </button>
      </div>

      {locationStatus && (
        <div className="text-[11px] text-[#004787] bg-[#d5e3ff] border border-[#a6c8ff] px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium">
          <span className="material-symbols-outlined text-[14px]">info</span>
          <span>{locationStatus}</span>
        </div>
      )}

      {/* Origin & Destination Inputs with Connector */}
      <div className="flex flex-col gap-2 relative">
        <div className="absolute left-[18px] top-[30px] bottom-[30px] w-px bg-[#c1c6d3] z-0"></div>

        {/* Origin Container */}
        <div id="origin-container" className="relative z-10">
          <div className="flex items-center gap-2 bg-[#fdf8fd] border border-[#c1c6d3] rounded-lg p-2 focus-within:border-[#004481] focus-within:ring-1 focus-within:ring-[#004481] transition-all">
            <button
              type="button"
              onClick={handleDetectGPS}
              title="Click to use Current GPS Location"
              className="text-[#004481] hover:bg-[#d5e3ff]/60 p-0.5 rounded transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">
                my_location
              </span>
            </button>
            <input
              ref={originInputRef}
              className="flex-grow bg-transparent border-none outline-none text-[16px] text-[#1c1b1f] focus:ring-0 p-1 placeholder:text-[#727783]"
              placeholder="Search origin address, MRT or postal..."
              type="text"
              value={origin}
              onChange={(e) => {
                onOriginChange(e.target.value);
                setShowOriginDropdown(true);
              }}
              onFocus={() => setShowOriginDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowOriginDropdown(false);
                  destInputRef.current?.focus();
                }
              }}
            />
            {isSearchingOrigin && (
              <span className="material-symbols-outlined text-[16px] text-[#004481] animate-spin">sync</span>
            )}
            {origin && (
              <button
                type="button"
                onClick={() => {
                  onOriginChange('');
                  setOriginSearchResults([]);
                  originInputRef.current?.focus();
                  setShowOriginDropdown(true);
                }}
                className="text-[#727783] hover:text-[#1c1b1f] p-1 cursor-pointer"
                title="Clear origin"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Origin Autocomplete Dropdown */}
          {showOriginDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#c1c6d3] rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
              {/* Quick shortcut to Current GPS */}
              <button
                type="button"
                onClick={() => {
                  handleDetectGPS();
                  setShowOriginDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#d5e3ff]/40 flex items-center gap-2 border-b border-[#c1c6d3] text-[#004787] font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">near_me</span>
                <span>Use Current GPS Location</span>
              </button>

              <div className="p-2 text-[11px] font-semibold text-[#727783] uppercase tracking-wider bg-[#f1ecf2] flex justify-between items-center">
                <span>{originSearchResults.length > 0 ? 'OneMap Live Search' : 'Suggested Locations'}</span>
                {originSearchResults.length > 0 && <span className="text-[10px] text-[#00752d] font-bold">OneMap API</span>}
              </div>

              {displayedOriginPlaces.length > 0 ? (
                displayedOriginPlaces.map((place, idx) => (
                  <button
                    key={`${place.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      onOriginChange(place.name);
                      setShowOriginDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#f1ecf2] flex items-center justify-between border-b border-[#f1ecf2] last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-medium text-[#1c1b1f] truncate block">{place.name}</span>
                      <span className="block text-xs text-[#414751] truncate">{place.address}</span>
                    </div>
                    {place.code && (
                      <span className="text-[10px] font-mono bg-[#e5e1e7] text-[#414751] px-1.5 py-0.5 rounded shrink-0">
                        {place.code}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-[#727783]">
                  No places found. Press enter to use "{origin}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Destination Container */}
        <div id="dest-container" className="relative z-10 mt-1">
          <div className="flex items-center gap-2 bg-[#fdf8fd] border border-[#c1c6d3] rounded-lg p-2 focus-within:border-[#004481] focus-within:ring-1 focus-within:ring-[#004481] transition-all">
            <span
              className="material-symbols-outlined text-[#ba1a1a] ml-1 text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <input
              ref={destInputRef}
              className="flex-grow bg-transparent border-none outline-none text-[16px] text-[#1c1b1f] focus:ring-0 p-1 placeholder:text-[#727783]"
              placeholder="Destination address, mall, or postal..."
              type="text"
              value={destination}
              onChange={(e) => {
                onDestinationChange(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => setShowDestDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowDestDropdown(false);
                  onPlanRoute();
                }
              }}
            />
            {isSearchingDest && (
              <span className="material-symbols-outlined text-[16px] text-[#004481] animate-spin">sync</span>
            )}
            {destination && (
              <button
                type="button"
                onClick={() => {
                  onDestinationChange('');
                  setDestSearchResults([]);
                  destInputRef.current?.focus();
                  setShowDestDropdown(true);
                }}
                className="text-[#727783] hover:text-[#1c1b1f] p-1 cursor-pointer"
                title="Clear destination"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Destination Autocomplete Dropdown */}
          {showDestDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#c1c6d3] rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
              <div className="p-2 text-[11px] font-semibold text-[#727783] uppercase tracking-wider bg-[#f1ecf2] flex justify-between items-center">
                <span>{destSearchResults.length > 0 ? 'OneMap Live Search' : 'Transit Hubs & Landmarks'}</span>
                {destSearchResults.length > 0 && <span className="text-[10px] text-[#00752d] font-bold">OneMap API</span>}
              </div>
              {displayedDestPlaces.length > 0 ? (
                displayedDestPlaces.map((place, idx) => (
                  <button
                    key={`${place.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      onDestinationChange(place.name);
                      setShowDestDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#f1ecf2] flex items-center justify-between border-b border-[#f1ecf2] last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-medium text-[#1c1b1f] truncate block">{place.name}</span>
                      <span className="block text-xs text-[#414751] truncate">{place.address}</span>
                    </div>
                    {place.code && (
                      <span className="text-[10px] font-mono bg-[#e5e1e7] text-[#414751] px-1.5 py-0.5 rounded shrink-0">
                        {place.code}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-[#727783]">
                  No places found. Press enter to use "{destination}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={onSwapLocations}
          title="Swap origin and destination"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#e5e1e7] text-[#414751] rounded-full p-1 z-20 hover:bg-[#c1c6d3] transition-colors border border-[#c1c6d3] shadow-sm cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">swap_vert</span>
        </button>
      </div>

      {/* Scheduling Section */}
      <div className="flex flex-col gap-2 border-t border-[#c1c6d3] pt-6">
        <div className="flex gap-2 bg-[#f1ecf2] rounded-lg p-1">
          <button
            type="button"
            onClick={() => onScheduleTypeChange('depart')}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
              scheduleType === 'depart'
                ? 'bg-white text-[#1c1b1f] shadow-sm border border-[#c1c6d3]'
                : 'text-[#414751] hover:bg-[#e5e1e7]'
            }`}
          >
            Depart At
          </button>
          <button
            type="button"
            onClick={() => onScheduleTypeChange('arrive')}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
              scheduleType === 'arrive'
                ? 'bg-white text-[#1c1b1f] shadow-sm border border-[#c1c6d3]'
                : 'text-[#414751] hover:bg-[#e5e1e7]'
            }`}
          >
            Arrive By
          </button>
        </div>

        <div className="flex gap-2">
          <div
            onClick={() => setShowScheduleModal(true)}
            className="flex-1 flex items-center justify-between bg-white border border-[#c1c6d3] rounded-lg p-3 cursor-pointer hover:border-[#727783] transition-colors"
          >
            <span className="text-sm font-medium text-[#1c1b1f]">{dateString}</span>
            <span className="material-symbols-outlined text-[#727783] text-[20px]">calendar_today</span>
          </div>

          <div
            onClick={() => setShowScheduleModal(true)}
            className="flex-1 flex items-center justify-between bg-white border border-[#c1c6d3] rounded-lg p-3 cursor-pointer hover:border-[#727783] transition-colors"
          >
            <span className="text-sm font-medium text-[#1c1b1f]">{timeString}</span>
            <span className="material-symbols-outlined text-[#727783] text-[20px]">schedule</span>
          </div>
        </div>
      </div>

      {/* Transport Modes Section */}
      <div className="flex flex-col gap-2 border-t border-[#c1c6d3] pt-6">
        <h3 className="text-[12px] font-bold text-[#727783] uppercase tracking-wider mb-1">
          Transport Modes
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onTransportModeChange('mixed')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              transportMode === 'mixed'
                ? 'bg-[#004481] text-white border border-[#004481] shadow-sm'
                : 'bg-white border border-[#c1c6d3] text-[#414751] hover:bg-[#e5e1e7]'
            }`}
          >
            {transportMode === 'mixed' && (
              <span className="material-symbols-outlined text-[18px]">done</span>
            )}
            Mixed
          </button>

          <button
            type="button"
            onClick={() => onTransportModeChange('bus_only')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              transportMode === 'bus_only'
                ? 'bg-[#004481] text-white border border-[#004481] shadow-sm'
                : 'bg-white border border-[#c1c6d3] text-[#414751] hover:bg-[#e5e1e7]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">directions_bus</span>
            Bus Only
          </button>

          <button
            type="button"
            onClick={() => onTransportModeChange('train_only')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              transportMode === 'train_only'
                ? 'bg-[#004481] text-white border border-[#004481] shadow-sm'
                : 'bg-white border border-[#c1c6d3] text-[#414751] hover:bg-[#e5e1e7]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">train</span>
            Train Only
          </button>
        </div>
      </div>

      {/* Plan Route CTA Button */}
      <button
        type="button"
        onClick={onPlanRoute}
        disabled={isPlanning}
        id="plan-route-cta"
        className="mt-auto w-full bg-[#004481] text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#005baa] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75"
      >
        {isPlanning ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Calculating Optimal Routes...
          </>
        ) : (
          'Plan Route'
        )}
      </button>

      {/* Weather Widget */}
      <div
        onClick={() => setShowWeatherDetail(!showWeatherDetail)}
        className="bg-white border border-[#c1c6d3] rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-[#727783] transition-all shadow-xs"
      >
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[#5f3c00] text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {weatherCondition === 'sunny' ? 'partly_cloudy_day' : 'rainy'}
          </span>
          <div>
            <div className="text-xs font-semibold text-[#1c1b1f] flex items-center gap-1.5">
              {weatherCondition === 'sunny' ? 'Mostly Sunny' : 'Passing Showers'}
              <span className="text-[10px] text-[#006e2a] font-normal underline">Tap to toggle</span>
            </div>
            <div className="text-xs text-[#414751]">
              {weatherCondition === 'sunny' ? 'Optimal travel conditions' : 'Sheltered MRT walkways recommended'}
            </div>
          </div>
        </div>
        <div className="text-xl font-bold text-[#1c1b1f]">
          {weatherCondition === 'sunny' ? '31°' : '27°'}
        </div>
      </div>

      {/* Weather forecast modal / details */}
      {showWeatherDetail && (
        <div className="bg-[#f1ecf2] border border-[#c1c6d3] rounded-lg p-3 text-xs flex flex-col gap-2">
          <div className="flex justify-between items-center font-bold text-[#1c1b1f]">
            <span>Live Weather & Transit Impact</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWeatherCondition(weatherCondition === 'sunny' ? 'rain' : 'sunny');
              }}
              className="text-[11px] bg-white border border-[#c1c6d3] px-2 py-0.5 rounded text-[#004481] hover:bg-[#e5e1e7]"
            >
              Simulate {weatherCondition === 'sunny' ? 'Rain' : 'Sunny'}
            </button>
          </div>
          <p className="text-[#414751]">
            {weatherCondition === 'sunny'
              ? 'Clear visibility across expressway bus corridors (PIE/TPE). SMRT trains operating at peak timetable frequency.'
              : 'Wet platform protocols active. Free umbrella sharing lockers available at Bishan, Jurong East, and Changi Airport.'}
          </p>
        </div>
      )}

      {/* Schedule Picker Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-[#c1c6d3] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#c1c6d3] pb-3">
              <h3 className="font-bold text-[#1c1b1f] text-base">Select Departure Time</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#727783] hover:text-[#1c1b1f]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-[#414751]">Quick Time Shortcuts</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Now', time: 'Now', date: 'Today' },
                  { label: '+15 min', time: '10:30 AM', date: 'Today' },
                  { label: '+30 min', time: '10:45 AM', date: 'Today' },
                  { label: '12:00 PM', time: '12:00 PM', date: 'Today' },
                  { label: '5:30 PM', time: '5:30 PM', date: 'Today' },
                  { label: 'Tomorrow', time: '08:30 AM', date: 'Tomorrow' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onDateTimeChange(item.date, item.time);
                      setShowScheduleModal(false);
                    }}
                    className="p-2 text-xs font-medium border border-[#c1c6d3] rounded-lg hover:border-[#004481] hover:bg-[#d5e3ff]/30 text-center transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="w-full bg-[#004481] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#005baa]"
            >
              Apply Schedule
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
