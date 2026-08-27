import { sendJson } from '../_utils/keys';

export default async function handler(req: any, res: any) {
  const key =
    process.env.LTA_DATAMAP_API_KEY ||
    process.env.LTA_DATAMALL_API_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_API_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.LTA_ONE_KEY ||
    process.env.VITE_LTA_DATAMAP_API_KEY ||
    process.env.VITE_LTA_DATAMALL_API_KEY ||
    process.env.VITE_LTA_API_KEY ||
    process.env.VITE_LTA_ACCOUNT_KEY ||
    process.env.VITE_LTA_ONE_KEY;

  const configured = !!(key && key.trim() !== '' && key !== 'MY_LTA_ACCOUNT_KEY' && key !== 'MY_LTA_DATAMAP_API_KEY');

  return sendJson(res, 200, {
    service: 'LTA DataMall API',
    configured,
    endpoints: {
      busArrival: '/api/lta/bus-arrival?busStopCode=83139&serviceNo=15',
      trafficIncidents: '/api/lta/traffic-incidents',
      trainAlerts: '/api/lta/train-alerts',
    },
  });
}
