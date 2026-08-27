import { Router, Request, Response } from 'express';
import statusHandler from './lta/status';
import busArrivalHandler from './lta/bus-arrival';
import trafficIncidentsHandler from './lta/traffic-incidents';
import trainAlertsHandler from './lta/train-alerts';

const router = Router();

router.get('/status', (req: Request, res: Response) => statusHandler(req, res));
router.get('/bus-arrival', (req: Request, res: Response) => busArrivalHandler(req, res));
router.get('/traffic-incidents', (req: Request, res: Response) => trafficIncidentsHandler(req, res));
router.get('/train-alerts', (req: Request, res: Response) => trainAlertsHandler(req, res));

export default router;
