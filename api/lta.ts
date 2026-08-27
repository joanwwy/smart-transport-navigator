import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Validates the LTA AccountKey credential from environment variables.
 * In accordance with strict security guardrails:
 * - Read ONLY from process.env inside api/
 * - If credential is missing at runtime, return HTTP 500 with {"error":"credential not configured"}
 *   rather than calling the provider without it.
 */
function getAccountKey(res: Response): string | null {
  const key =
    process.env.LTA_DATAMAP_API_KEY ||
    process.env.LTA_DATAMALL_API_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY;
  if (!key || key.trim() === '' || key === 'MY_LTA_ACCOUNT_KEY') {
    res.status(500).json({ error: 'credential not configured' });
    return null;
  }
  return key.trim();
}

/**
 * Status check endpoint (does not expose secret key)
 * GET /api/lta/status
 */
router.get('/status', (_req: Request, res: Response) => {
  const key =
    process.env.LTA_DATAMAP_API_KEY ||
    process.env.LTA_DATAMALL_API_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY;
  const configured = !!(key && key.trim() !== '' && key !== 'MY_LTA_ACCOUNT_KEY');
  res.json({
    service: 'LTA DataMall API',
    configured,
    endpoints: {
      busArrival: '/api/lta/bus-arrival?busStopCode=83139&serviceNo=15',
      trafficIncidents: '/api/lta/traffic-incidents',
      trainAlerts: '/api/lta/train-alerts',
    },
  });
});

/**
 * 1. Next buses at a stop (v3 - current version; 20-second refresh)
 * Endpoint: https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
 * Optional: &ServiceNo=15
 * 
 * GET /api/lta/bus-arrival?busStopCode=83139&serviceNo=15
 */
router.get('/bus-arrival', async (req: Request, res: Response) => {
  const accountKey = getAccountKey(res);
  if (!accountKey) return;

  const busStopCode = req.query.busStopCode || req.query.BusStopCode;
  const serviceNo = req.query.serviceNo || req.query.ServiceNo;

  if (!busStopCode) {
    res.status(400).json({ error: 'BusStopCode parameter is required' });
    return;
  }

  try {
    let targetUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(String(busStopCode))}`;
    if (serviceNo) {
      targetUrl += `&ServiceNo=${encodeURIComponent(String(serviceNo))}`;
    }

    const apiResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      res.status(apiResponse.status).json({
        error: `LTA DataMall error (${apiResponse.status}): ${apiResponse.statusText}`,
        details: errorBody,
      });
      return;
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to communicate with LTA DataMall BusArrival service',
      message: err?.message || String(err),
    });
  }
});

/**
 * 2. Traffic Incidents
 * Endpoint: https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
 * 
 * GET /api/lta/traffic-incidents
 */
router.get('/traffic-incidents', async (_req: Request, res: Response) => {
  const accountKey = getAccountKey(res);
  if (!accountKey) return;

  try {
    const targetUrl = 'https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents';
    const apiResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      res.status(apiResponse.status).json({
        error: `LTA DataMall error (${apiResponse.status}): ${apiResponse.statusText}`,
        details: errorBody,
      });
      return;
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to communicate with LTA DataMall TrafficIncidents service',
      message: err?.message || String(err),
    });
  }
});

/**
 * 3. MRT/LRT Train Service Alerts
 * Endpoint: https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts
 * 
 * GET /api/lta/train-alerts
 */
router.get('/train-alerts', async (_req: Request, res: Response) => {
  const accountKey = getAccountKey(res);
  if (!accountKey) return;

  try {
    const targetUrl = 'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts';
    const apiResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      res.status(apiResponse.status).json({
        error: `LTA DataMall error (${apiResponse.status}): ${apiResponse.statusText}`,
        details: errorBody,
      });
      return;
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to communicate with LTA DataMall TrainServiceAlerts service',
      message: err?.message || String(err),
    });
  }
});

export default router;
