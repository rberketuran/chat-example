import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import cors from 'cors';
import dotenv from 'dotenv';
import verifyToken from './middlewares/authJwt.js';
import setupSocketIO from './socket.js'; // Import the socket.io setup function
import setupPrimary from '@socket.io/cluster-adapter';

dotenv.config();

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }

  cluster.setupPrimary();
} else {
  const app = express();
  const server = createServer(app);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors());


  app.get('/', verifyToken, (req, res) => {
    res.sendFile(join(__dirname, '/public/index.html'));
  });

  // Ensure this middleware is set up before userRoutes if it's necessary
  app.use('/api/v1/user', express.static('public'));

  // Handle user-related routes
  app.use('/api/v1/user', userRoutes);

  app.use(express.static(join(__dirname, 'public')));

  // Pass server to socket.io setup function
  setupSocketIO(server);

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
