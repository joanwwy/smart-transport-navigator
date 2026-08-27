import { getOneMapToken, getQueryParam, sendJson } from '../_utils/keys';

export default async function handler(req: any, res: any) {
  const token = await getOneMapToken(res);
  if (!token) return;

  const lat = getQueryParam(req, 'lat');
  const lng = getQueryParam(req, 'lng');
  const location = getQueryParam(req, 'location') || (lat && lng ? `${lat},${lng}` : null);
  const buffer = getQueryParam(req, 'buffer') || '40';
  const addressType = getQueryParam(req, 'addressType') || 'All';

  if (!location) {
    return sendJson(res, 400, { error: 'location (lat,lng) query parameter is required' });
  }

  try {
    const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${encodeURIComponent(
      String(location)
    )}&buffer=${encodeURIComponent(String(buffer))}&addressType=${encodeURIComponent(String(addressType))}`;

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
        error: `OneMap reverse geocode error (${apiRes.status})`,
        details: errText,
      });
    }

    const data = await apiRes.json();
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, {
      error: 'Failed to communicate with OneMap reverse geocode service',
      message: err?.message || String(err),
    });
  }
}
