import { getOneMapToken, getQueryParam, sendJson } from '../_utils/keys';

export default async function handler(req: any, res: any) {
  const token = await getOneMapToken(res);
  if (!token) return;

  const start = getQueryParam(req, 'start');
  const end = getQueryParam(req, 'end');
  const routeType = getQueryParam(req, 'routeType') || 'pt';

  if (!start || !end) {
    return sendJson(res, 400, { error: 'start and end parameters (lat,lng) are required' });
  }

  try {
    let url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${encodeURIComponent(
      String(start)
    )}&end=${encodeURIComponent(String(end))}&routeType=${encodeURIComponent(String(routeType))}`;

    const date = getQueryParam(req, 'date');
    const time = getQueryParam(req, 'time');
    const mode = getQueryParam(req, 'mode');
    const maxWalkDistance = getQueryParam(req, 'maxWalkDistance');
    const numItineraries = getQueryParam(req, 'numItineraries');

    if (date) url += `&date=${encodeURIComponent(String(date))}`;
    if (time) url += `&time=${encodeURIComponent(String(time))}`;
    if (mode) url += `&mode=${encodeURIComponent(String(mode))}`;
    if (maxWalkDistance) url += `&maxWalkDistance=${encodeURIComponent(String(maxWalkDistance))}`;
    if (numItineraries) url += `&numItineraries=${encodeURIComponent(String(numItineraries))}`;

    const apiRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
        accept: 'application/json',
      },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return sendJson(res, apiRes.status, {
        error: `OneMap route error (${apiRes.status})`,
        details: errText,
      });
    }

    const data = await apiRes.json();
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, {
      error: 'Failed to communicate with OneMap routing service',
      message: err?.message || String(err),
    });
  }
}
