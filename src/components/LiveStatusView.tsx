import React, { useState, useEffect, useCallback } from 'react';
import { LINE_STATUSES } from '../data/mockTransitData';

interface LTABusArrival {
  ServiceNo: string;
  Operator: string;
  NextBus?: {
    EstimatedArrival?: string;
    Latitude?: string;
    Longitude?: string;
    VisitNumber?: string;
    Load?: string;
    Feature?: string;
    Type?: string;
  };
  NextBus2?: {
    EstimatedArrival?: string;
    Load?: string;
    Feature?: string;
    Type?: string;
  };
  NextBus3?: {
    EstimatedArrival?: string;
    Load?: string;
    Feature?: string;
    Type?: string;
  };
}

// Helper to calculate minutes to arrival
function calculateMinutesToArrival(estimatedTimeStr?: string): string {
  if (!estimatedTimeStr) return 'No Est.';
  try {
    const target = new Date(estimatedTimeStr).getTime();
    const now = Date.now();
    const diffMins = Math.round((target - now) / 60000);
    if (isNaN(diffMins)) return 'No Est.';
    if (diffMins <= 0) return 'Arr';
    if (diffMins === 1) return '1 min';
    return `${diffMins} mins`;
  } catch {
    return 'No Est.';
  }
}

function parseLoadLabel(loadCode?: string): { label: string; color: string; bg: string } {
  switch (loadCode) {
    case 'SEA':
      return { label: 'Seats Available', color: 'text-[#00752d]', bg: 'bg-[#83fc94]/30' };
    case 'SDA':
      return { label: 'Standing Available', color: 'text-[#643f00]', bg: 'bg-[#ffddb5]' };
    case 'LSD':
      return { label: 'Limited Standing', color: 'text-[#93000a]', bg: 'bg-[#ffdad6]' };
    default:
      return { label: 'Seats Available', color: 'text-[#414751]', bg: 'bg-[#f1ecf2]' };
  }
}

function parseTypeLabel(typeCode?: string): string {
  switch (typeCode) {
    case 'DD':
      return 'Double Deck';
    case 'BD':
      return 'Bendy Bus';
    case 'SD':
    default:
      return 'Single Deck';
  }
}

export const LiveStatusView: React.FC = () => {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [busStopSearch, setBusStopSearch] = useState('83139');
  const [serviceNoFilter, setServiceNoFilter] = useState('');
  const [activeBusTab, setActiveBusTab] = useState<'mrt' | 'bus'>('bus');

  // Live API Telemetry States
  const [isFetchingBuses, setIsFetchingBuses] = useState(false);
  const [busApiData, setBusApiData] = useState<LTABusArrival[] | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(20);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fallback realistic sample if API key is not yet configured in environment
  const fallbackBusArrivals = [
    { service: '15', destination: 'Pasir Ris Int (via Marine Parade)', nextBus: '2 min', nextNextBus: '11 min', type: 'Double Deck', crowd: 'Seats Available', operator: 'GAS' },
    { service: '168', destination: 'Woodlands Int / Bedok', nextBus: '4 min', nextNextBus: '12 min', type: 'Double Deck', crowd: 'Seats Available', operator: 'SBST' },
    { service: '858', destination: 'Changi Airport T2/T3', nextBus: '7 min', nextNextBus: '18 min', type: 'Single Deck', crowd: 'Standing Available', operator: 'TTS' },
    { service: '36', destination: 'Changi Airport PTB1/3/4', nextBus: '9 min', nextNextBus: '21 min', type: 'Single Deck', crowd: 'Seats Available', operator: 'GAS' },
  ];

  // Fetch Bus Arrivals from Backend (/api/lta/bus-arrival)
  const fetchBusArrivals = useCallback(async () => {
    if (!busStopSearch.trim()) return;
    setIsFetchingBuses(true);
    setErrorMessage(null);

    try {
      let queryUrl = `/api/lta/bus-arrival?busStopCode=${encodeURIComponent(busStopSearch.trim())}`;
      if (serviceNoFilter.trim()) {
        queryUrl += `&serviceNo=${encodeURIComponent(serviceNoFilter.trim())}`;
      }

      const res = await fetch(queryUrl);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error === 'credential not configured') {
          setApiConnected(false);
          setErrorMessage('LTA AccountKey not detected in server environment variables. Ensure variable is assigned to Production environment in Vercel.');
        } else if (res.status === 401 || errJson.details?.includes('401') || errJson.error?.includes('401')) {
          setApiConnected(false);
          setErrorMessage('LTA DataMall rejected the AccountKey (401 Unauthorized). Please ensure your key is activated on DataMall portal.');
        } else {
          setErrorMessage(errJson.error || errJson.message || `HTTP ${res.status} Error`);
        }
        setBusApiData(null);
      } else {
        const data = await res.json();
        setApiConnected(true);
        if (data.Services && Array.isArray(data.Services)) {
          setBusApiData(data.Services);
        } else {
          setBusApiData([]);
        }
      }
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshCountdown(20);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network communication error');
      setApiConnected(false);
    } finally {
      setIsFetchingBuses(false);
    }
  }, [busStopSearch, serviceNoFilter]);

  // Initial fetch on mount & stop search change
  useEffect(() => {
    fetchBusArrivals();
  }, [fetchBusArrivals]);

  // 20-Second Auto-refresh Timer for LTA v3 BusArrival
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchBusArrivals();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchBusArrivals]);

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white border border-[#c1c6d3] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#006e2a] animate-pulse"></span>
            <h2 className="text-2xl font-bold text-[#1c1b1f] tracking-tight">MRT & Bus Live Network Status</h2>
          </div>
          <p className="text-sm text-[#414751] mt-1">
            Real-time train line frequencies, platform congestion, and live LTA DataMall v3 bus arrival telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-[#c1c6d3] bg-[#fdf8fd]">
            <span className="w-2 h-2 rounded-full bg-[#006e2a]"></span>
            <span>20s Refresh: <strong className="text-[#004481]">{refreshCountdown}s</strong></span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveBusTab('bus')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeBusTab === 'bus'
                  ? 'bg-[#004481] text-white'
                  : 'bg-[#f1ecf2] text-[#414751] hover:bg-[#e5e1e7]'
              }`}
            >
              Bus Arrival Radar
            </button>
            <button
              onClick={() => setActiveBusTab('mrt')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeBusTab === 'mrt'
                  ? 'bg-[#004481] text-white'
                  : 'bg-[#f1ecf2] text-[#414751] hover:bg-[#e5e1e7]'
              }`}
            >
              Train Network
            </button>
          </div>
        </div>
      </div>

      {/* Bus Arrival Radar View */}
      {activeBusTab === 'bus' && (
        <div className="flex flex-col gap-4">
          {/* Search and Telemetry Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-[#c1c6d3] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004481]">directions_bus</span>
                <span className="text-xs font-bold text-[#1c1b1f] uppercase tracking-wider">Bus Stop Code:</span>
                <input
                  type="text"
                  value={busStopSearch}
                  onChange={(e) => setBusStopSearch(e.target.value)}
                  placeholder="e.g. 83139, 04111"
                  className="w-28 border border-[#c1c6d3] rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-[#004481] outline-none focus:border-[#004481] focus:ring-1 focus:ring-[#004481]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#727783]">Service No:</span>
                <input
                  type="text"
                  value={serviceNoFilter}
                  onChange={(e) => setServiceNoFilter(e.target.value)}
                  placeholder="e.g. 15 (optional)"
                  className="w-32 border border-[#c1c6d3] rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-[#004481]"
                />
              </div>

              <button
                onClick={() => fetchBusArrivals()}
                disabled={isFetchingBuses}
                className="bg-[#004481] hover:bg-[#005baa] disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[16px] ${isFetchingBuses ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isFetchingBuses ? 'Querying...' : 'Fetch Live'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-[#727783] border-t lg:border-t-0 pt-2 lg:pt-0 border-[#f1ecf2]">
              {apiConnected ? (
                <div className="flex items-center gap-1.5 bg-[#83fc94]/30 text-[#00752d] px-2.5 py-1 rounded-md font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#006e2a] animate-pulse"></span>
                  LTA DataMall v3 Live Stream
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#ffdad6] text-[#93000a] px-2.5 py-1 rounded-md font-medium text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  LTA AccountKey: Unset (Sample Active)
                </div>
              )}
              {lastUpdatedTime && (
                <span className="font-mono text-[11px]">Updated: {lastUpdatedTime}</span>
              )}
            </div>
          </div>

          {/* Error / Notice Banner */}
          {errorMessage && (
            <div className="bg-[#f1ecf2] border border-[#c1c6d3] rounded-xl p-3 text-xs text-[#414751] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004481] text-[18px]">info</span>
                <span>{errorMessage}</span>
              </div>
              <span className="text-[10px] font-mono text-[#727783]">Backend Guardrail Active</span>
            </div>
          )}

          {/* Bus Grid: Real LTA Data or Fallback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {busApiData && busApiData.length > 0 ? (
              busApiData.map((bus) => {
                const nextBusMin = calculateMinutesToArrival(bus.NextBus?.EstimatedArrival);
                const nextNextBusMin = calculateMinutesToArrival(bus.NextBus2?.EstimatedArrival);
                const loadTheme = parseLoadLabel(bus.NextBus?.Load);
                const deckType = parseTypeLabel(bus.NextBus?.Type);
                const isWab = bus.NextBus?.Feature === 'WAB';

                return (
                  <div
                    key={bus.ServiceNo}
                    className="bg-white border border-[#c1c6d3] rounded-xl p-4 flex justify-between items-center shadow-xs hover:border-[#004481] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-13 h-13 bg-[#d5e3ff] text-[#004787] border border-[#a6c8ff] rounded-xl font-extrabold font-mono text-xl flex items-center justify-center shadow-xs">
                        {bus.ServiceNo}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-[#1c1b1f]">Service {bus.ServiceNo}</h4>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-[#f1ecf2] text-[#414751] rounded">
                            {bus.Operator || 'LTA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#727783]">{deckType}</span>
                          <span className="text-[#c1c6d3]">•</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-full ${loadTheme.bg} ${loadTheme.color}`}>
                            {loadTheme.label}
                          </span>
                          {isWab && (
                            <span className="material-symbols-outlined text-[15px] text-[#004481]" title="Wheelchair Accessible Bus">
                              accessible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-[#004481] text-white text-xs font-bold px-3 py-1 rounded-lg font-mono tabular-nums tracking-wide">
                        {nextBusMin}
                      </div>
                      <span className="text-[11px] text-[#727783] font-mono">
                        Next: {nextNextBusMin}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : busApiData && busApiData.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl p-8 text-center border border-[#c1c6d3] text-[#727783]">
                <span className="material-symbols-outlined text-[36px] text-[#c1c6d3]">directions_bus</span>
                <p className="font-bold text-[#1c1b1f] mt-2">No active bus services found for stop {busStopSearch}</p>
                <p className="text-xs mt-1">Check if the bus stop code is valid or try stop 83139 / 04111.</p>
              </div>
            ) : (
              // Fallback Sample Cards
              fallbackBusArrivals.map((bus) => (
                <div
                  key={bus.service}
                  className="bg-white border border-[#c1c6d3] rounded-xl p-4 flex justify-between items-center shadow-xs hover:border-[#727783] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 bg-[#83fc94]/40 text-[#00752d] border border-[#006e2a] rounded-xl font-extrabold font-mono text-xl flex items-center justify-center">
                      {bus.service}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-[#1c1b1f]">{bus.destination}</h4>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-[#f1ecf2] text-[#414751] rounded">
                          {bus.operator}
                        </span>
                      </div>
                      <span className="text-xs text-[#727783] mt-0.5 block">{bus.type} • {bus.crowd}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-[#005baa] text-white text-xs font-bold px-3 py-1 rounded-lg font-mono">
                      {bus.nextBus}
                    </div>
                    <span className="text-[11px] text-[#727783] font-mono">
                      Next: {bus.nextNextBus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MRT Lines View */}
      {activeBusTab === 'mrt' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LINE_STATUSES.map((line) => {
            const isNormal = line.status === 'Normal Service';

            return (
              <div
                key={line.lineCode}
                onClick={() => setSelectedLine(selectedLine === line.lineCode ? null : line.lineCode)}
                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-xs ${
                  selectedLine === line.lineCode
                    ? 'border-[#004481] ring-2 ring-[#004481]/20'
                    : 'border-[#c1c6d3] hover:border-[#727783]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-md text-xs font-bold font-mono text-white shadow-xs"
                      style={{ backgroundColor: line.color, color: line.textColor }}
                    >
                      {line.lineCode}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1c1b1f] text-sm">{line.name}</h3>
                      <span className="text-xs text-[#727783]">Frequency: {line.frequency}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isNormal
                        ? 'bg-[#83fc94]/40 text-[#00752d]'
                        : 'bg-[#ffdad6] text-[#93000a]'
                    }`}
                  >
                    {line.status}
                  </span>
                </div>

                {line.delayNotice && (
                  <div className="mt-3 bg-[#ffdad6]/60 border border-[#ffb4ab] rounded-lg p-2 text-xs text-[#93000a]">
                    {line.delayNotice}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[#f1ecf2] flex justify-between items-center text-[11px] text-[#727783]">
                  <span>Updated {line.lastUpdated}</span>
                  <span className="text-[#004481] font-medium flex items-center gap-0.5">
                    {selectedLine === line.lineCode ? 'Hide details' : 'View line map'}
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedLine === line.lineCode ? 'expand_less' : 'chevron_right'}
                    </span>
                  </span>
                </div>

                {selectedLine === line.lineCode && (
                  <div className="mt-3 pt-2 border-t border-[#f1ecf2] text-xs flex flex-col gap-1 text-[#414751]">
                    <div className="font-semibold text-[#1c1b1f]">Key Interchanges:</div>
                    <p className="text-[11px] text-[#727783]">
                      Jurong East, Bishan, City Hall, Raffles Place, Dhoby Ghaut, Marina Bay, Woodlands, Outram Park.
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#006e2a]"></span>
                      <span className="text-[11px]">Platform screen doors & gantry systems fully operational.</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
