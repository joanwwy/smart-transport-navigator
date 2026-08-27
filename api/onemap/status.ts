import { sendJson } from '../_utils/keys';

export default async function handler(req: any, res: any) {
  const directToken = process.env.ONEMAP_API_KEY || process.env.ONEMAP_TOKEN;
  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;

  const configured = !!(
    (directToken && directToken.trim() !== '' && directToken !== 'MY_ONEMAP_API_KEY') ||
    (email && password && email !== 'MY_ONEMAP_EMAIL' && password !== 'MY_ONEMAP_PASSWORD')
  );

  return sendJson(res, 200, {
    service: 'OneMap SG API',
    configured,
    endpoints: {
      search: '/api/onemap/search?searchVal=raffles%20place',
      revgeocode: '/api/onemap/revgeocode?lat=1.3000&lng=103.8000',
      route: '/api/onemap/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=pt',
    },
  });
}
