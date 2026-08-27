import { Router, Request, Response } from 'express';
import statusHandler from './onemap/status';
import searchHandler from './onemap/search';
import revgeocodeHandler from './onemap/revgeocode';
import routeHandler from './onemap/route';

const router = Router();

router.get('/status', (req: Request, res: Response) => statusHandler(req, res));
router.get('/search', (req: Request, res: Response) => searchHandler(req, res));
router.get('/revgeocode', (req: Request, res: Response) => revgeocodeHandler(req, res));
router.get('/route', (req: Request, res: Response) => routeHandler(req, res));

export default router;
