import { sendJson } from './_utils/keys';

export default async function handler(req: any, res: any) {
  return sendJson(res, 200, {
    status: 'ok',
    service: 'Smart Transport Navigator API (Vercel Serverless)',
    timestamp: new Date().toISOString(),
  });
}
