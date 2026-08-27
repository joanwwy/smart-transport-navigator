import { Router } from 'express';
import searchHandler from './search';
import routeHandler from './route';
import revgeocodeHandler from './revgeocode';
import statusHandler from './status';

const router = Router();

router.get('/search', (req, res) => {
  searchHandler(req, res);
});

router.get('/route', (req, res) => {
  routeHandler(req, res);
});

router.get('/revgeocode', (req, res) => {
  revgeocodeHandler(req, res);
});

router.get('/status', (req, res) => {
  statusHandler(req, res);
});

export default router;
