import { Router } from 'express';
import busArrivalHandler from './bus-arrival';
import trafficIncidentsHandler from './traffic-incidents';
import trainAlertsHandler from './train-alerts';
import statusHandler from './status';

const router = Router();

router.get('/bus-arrival', (req, res) => {
  busArrivalHandler(req, res);
});

router.get('/traffic-incidents', (req, res) => {
  trafficIncidentsHandler(req, res);
});

router.get('/train-alerts', (req, res) => {
  trainAlertsHandler(req, res);
});

router.get('/status', (req, res) => {
  statusHandler(req, res);
});

export default router;
