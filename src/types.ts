export type TransportMode = 'mixed' | 'bus_only' | 'train_only';
export type ScheduleType = 'depart' | 'arrive';
export type SortOption = 'best_match' | 'fastest' | 'least_transfers' | 'least_walking';
export type TabType = 'plan' | 'live_status' | 'saved' | 'alerts';

export interface TransitSegment {
  id: string;
  mode: 'walk' | 'train' | 'bus';
  durationMinutes: number;
  label: string; // e.g. "5 min", "NSL", "168", "858", "EWL"
  lineCode?: 'NSL' | 'EWL' | 'CCL' | 'DTL' | 'TEL' | 'NEL' | 'BPLRT';
  lineName?: string;
  serviceNumber?: string;
  fromStop: string;
  toStop: string;
  numStops?: number;
  platform?: string;
  headsign?: string;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
  intermediateStops?: string[];
  crowdLevel?: 'Low' | 'Moderate' | 'High';
}

export interface DetailedStep {
  time: string;
  instruction: string;
  detail?: string;
  mode: 'walk' | 'train' | 'bus' | 'destination';
  badge?: string;
  badgeColor?: string;
  duration?: string;
  stopsCount?: number;
  intermediateStops?: string[];
}

export interface RouteOption {
  id: string;
  totalDurationMinutes: number;
  departureTime: string;
  arrivalTime: string;
  status: 'On Time' | 'Minor Delay' | 'Disrupted' | 'Heavy Rain Advisory';
  statusColor?: string;
  badge?: 'Most Optimal' | 'Fastest' | 'Least Transfers' | 'Direct Bus' | 'Cheapest';
  isOptimal?: boolean;
  fare: string;
  calories: number;
  carbonSaved: string; // e.g. "1.2 kg CO₂"
  segments: TransitSegment[];
  detailedSteps: DetailedStep[];
  transportType: 'mixed' | 'bus_only' | 'train_only';
}

export interface PlaceItem {
  id: string;
  name: string;
  code?: string;
  category: 'station' | 'bus_stop' | 'landmark' | 'recent';
  address: string;
  lines?: string[];
}

export interface LineStatus {
  lineCode: 'NSL' | 'EWL' | 'CCL' | 'DTL' | 'TEL' | 'NEL' | 'BPLRT';
  name: string;
  color: string;
  textColor: string;
  status: 'Normal Service' | 'Minor Delay' | 'Disrupted' | 'Track Maintenance';
  frequency: string;
  delayNotice?: string;
  affectedSegment?: string;
  lastUpdated: string;
}

export interface TransitAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  timestamp: string;
  affectedLine: string;
  description: string;
  bridgingBus: boolean;
  bridgingBusRoute?: string;
}

export interface SavedRoute {
  id: string;
  title: string;
  origin: string;
  destination: string;
  preferredMode: TransportMode;
  usualDuration: string;
  notifyTime?: string;
  tags: string[];
}
