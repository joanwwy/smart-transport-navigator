import { getLtaAccountKey, sendJson } from '../_utils/keys';

export default async function handler(req: any, res: any) {
  const accountKey = getLtaAccountKey(res);
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
      return sendJson(res, apiResponse.status, {
        error: `LTA DataMall error (${apiResponse.status}): ${apiResponse.statusText}`,
        details: errorBody,
      });
    }

    const data = await apiResponse.json();
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, {
      error: 'Failed to communicate with LTA DataMall TrainServiceAlerts service',
      message: err?.message || String(err),
    });
  }
}
