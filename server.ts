import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import ltaBusArrival from './api/lta/bus-arrival';
import ltaTrafficIncidents from './api/lta/traffic-incidents';
import ltaTrainAlerts from './api/lta/train-alerts';
import ltaStatus from './api/lta/status';

import onemapSearch from './api/onemap/search';
import onemapRoute from './api/onemap/route';
import onemapRevgeocode from './api/onemap/revgeocode';
import onemapStatus from './api/onemap/status';
import healthHandler from './api/health';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => healthHandler(req, res));

  // LTA DataMall endpoints
  app.get('/api/lta/bus-arrival', (req, res) => ltaBusArrival(req, res));
  app.get('/api/lta/traffic-incidents', (req, res) => ltaTrafficIncidents(req, res));
  app.get('/api/lta/train-alerts', (req, res) => ltaTrainAlerts(req, res));
  app.get('/api/lta/status', (req, res) => ltaStatus(req, res));

  // OneMap endpoints
  app.get('/api/onemap/search', (req, res) => onemapSearch(req, res));
  app.get('/api/onemap/route', (req, res) => onemapRoute(req, res));
  app.get('/api/onemap/revgeocode', (req, res) => onemapRevgeocode(req, res));
  app.get('/api/onemap/status', (req, res) => onemapStatus(req, res));

  // Vite development middleware vs production static distribution
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Transport Navigator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
