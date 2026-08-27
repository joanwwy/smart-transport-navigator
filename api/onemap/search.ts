import { getOneMapToken, getQueryParam, sendJson } from '../_utils/keys';

export default async function handler(req: any, res: any) {
  const token = await getOneMapToken(res);
  if (!token) return;

  const searchVal = getQueryParam(req, 'searchVal') || getQueryParam(req, 'query');
  const pageNum = getQueryParam(req, 'pageNum') || '1';

  if (!searchVal) {
    return sendJson(res, 400, { error: 'searchVal query parameter is required' });
  }

  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      String(searchVal)
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=${encodeURIComponent(String(pageNum))}`;

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
        error: `OneMap search error (${apiRes.status})`,
        details: errText,
      });
    }

    const data = await apiRes.json();
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, {
      error: 'Failed to communicate with OneMap search service',
      message: err?.message || String(err),
    });
  }
}
