import type { IncomingMessage, ServerResponse } from 'http';

export interface ExtendedRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  url?: string;
  method?: string;
}

export interface ExtendedResponse extends ServerResponse {
  status: (code: number) => ExtendedResponse;
  json: (body: any) => void;
  send: (body: any) => void;
}

/**
 * Standardizes parameter extraction across Express and Vercel Serverless runtimes
 */
export function getQueryParam(req: any, key: string): string | undefined {
  if (req.query && req.query[key] !== undefined) {
    const val = req.query[key];
    return Array.isArray(val) ? val[0] : String(val);
  }
  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const val = url.searchParams.get(key);
      if (val !== null) return val;
    } catch {
      // ignore
    }
  }
  return undefined;
}

/**
 * Send JSON response safely across Express and Vercel Serverless
 */
export function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Validates the LTA AccountKey credential from environment variables.
 * In accordance with strict security guardrails:
 * - Read ONLY from process.env inside api/
 * - If credential is missing at runtime, return HTTP 500 with {"error":"credential not configured"}
 */
export function getLtaAccountKey(res: any): string | null {
  const envVars = [
    process.env.LTA_DATAMAP_API_KEY,
    process.env.LTA_DATAMALL_API_KEY,
    process.env.LTA_ACCOUNT_KEY,
    process.env.LTA_API_KEY,
    process.env.ACCOUNT_KEY,
    process.env.LTA_ONE_KEY,
    process.env.VITE_LTA_DATAMAP_API_KEY,
    process.env.VITE_LTA_DATAMALL_API_KEY,
    process.env.VITE_LTA_API_KEY,
    process.env.VITE_LTA_ACCOUNT_KEY,
    process.env.VITE_LTA_ONE_KEY,
  ];

  let rawKey = envVars.find((v) => v && typeof v === 'string' && v.trim() !== '');

  // Strip wrapping quotes if user entered them in Vercel UI e.g. "xxx" or 'xxx'
  if (rawKey) {
    rawKey = rawKey.trim();
    if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
      rawKey = rawKey.slice(1, -1).trim();
    }
  }

  if (!rawKey || rawKey === '' || rawKey === 'MY_LTA_ACCOUNT_KEY' || rawKey === 'MY_LTA_DATAMAP_API_KEY' || rawKey === 'MY_LTA_ONE_KEY') {
    sendJson(res, 500, {
      error: 'credential not configured',
      message: 'No active LTA AccountKey found in server environment variables. Please check Vercel environment settings and redeploy.',
      checkedKeys: [
        'LTA_DATAMAP_API_KEY',
        'LTA_ACCOUNT_KEY',
        'LTA_ONE_KEY',
        'LTA_API_KEY'
      ]
    });
    return null;
  }
  return rawKey;
}

// In-memory token cache for OneMap across serverless invocations
let cachedOneMapToken: string | null = null;
let tokenExpiryTimestamp: number = 0;

/**
 * Retrieves a valid OneMap token adhering to strict credential guardrails:
 * - Credentials read ONLY from process.env inside api/
 * - Supports ONEMAP_API_KEY / ONEMAP_TOKEN / LTA_ONE_KEY directly, OR auto-mints using ONEMAP_EMAIL & ONEMAP_PASSWORD
 * - If credential is missing at runtime, return HTTP 500 with {"error":"credential not configured"}
 */
export async function getOneMapToken(res: any): Promise<string | null> {
  const directToken =
    process.env.ONEMAP_API_KEY ||
    process.env.ONEMAP_TOKEN ||
    process.env.LTA_ONE_KEY ||
    process.env.ONEMAP_KEY ||
    process.env.ONE_KEY ||
    process.env.LTA_ONEMAP_KEY ||
    process.env.VITE_ONEMAP_API_KEY ||
    process.env.VITE_LTA_ONE_KEY;
  if (directToken && directToken.trim() !== '' && directToken !== 'MY_ONEMAP_API_KEY' && directToken !== 'MY_LTA_ONE_KEY') {
    return directToken.trim();
  }

  const now = Date.now();
  if (cachedOneMapToken && tokenExpiryTimestamp > now + 60000) {
    return cachedOneMapToken;
  }

  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;

  if (!email || !password || email === 'MY_ONEMAP_EMAIL' || password === 'MY_ONEMAP_PASSWORD') {
    sendJson(res, 500, { error: 'credential not configured' });
    return null;
  }

  try {
    const authRes = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
      }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      sendJson(res, authRes.status, {
        error: `OneMap authentication failed (${authRes.status})`,
        details: errText,
      });
      return null;
    }

    const authData: any = await authRes.json();
    if (authData.access_token) {
      cachedOneMapToken = authData.access_token;
      const expiryInMs = (authData.expiry_timestamp ? new Date(authData.expiry_timestamp).getTime() - now : 3 * 24 * 3600 * 1000) - 300000;
      tokenExpiryTimestamp = now + Math.max(expiryInMs, 3600000);
      return cachedOneMapToken;
    } else {
      sendJson(res, 500, {
        error: 'Invalid response from OneMap token service',
        details: authData,
      });
      return null;
    }
  } catch (err: any) {
    sendJson(res, 500, {
      error: 'Failed to mint OneMap token',
      message: err?.message || String(err),
    });
    return null;
  }
}
