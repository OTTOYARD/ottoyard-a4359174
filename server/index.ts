// Express API server for OttoCommand agent tools

import express from 'express';
import cors from 'cors';
import { executeAgentTool, agentTools } from '../src/agent/tools';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { body } = req;

  // Basic validation
  if (req.method === 'POST' && (!body || typeof body !== 'object')) {
    return res.status(400).json({
      error: 'Invalid request body',
      message: 'Request body must be a valid JSON object',
    });
  }

  next();
};

// API Routes

// GET /api/stalls?depot_id=&status=
app.get('/api/stalls', (req, res) => {
  const { depot_id, status } = req.query;

  if (!depot_id || typeof depot_id !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid depot_id parameter',
    });
  }

  try {
    const result = executeAgentTool('list_stalls', { depot_id, status });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/charging-queue?depot_id=
app.get('/api/charging-queue', (req, res) => {
  const { depot_id } = req.query;

  if (!depot_id || typeof depot_id !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid depot_id parameter',
    });
  }

  try {
    const result = executeAgentTool('get_charging_queue', { depot_id });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/schedule-vehicle
app.post('/api/schedule-vehicle', validateRequest, (req, res) => {
  const { vehicle_id, stall_id, start, end } = req.body;

  // Validate required parameters
  if (!vehicle_id || !stall_id || !start || !end) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'vehicle_id, stall_id, start, and end are required',
    });
  }

  if (typeof vehicle_id !== 'string' || typeof stall_id !== 'string' ||
      typeof start !== 'string' || typeof end !== 'string') {
    return res.status(400).json({
      error: 'Invalid parameter types',
      message: 'All parameters must be strings',
    });
  }

  try {
    const result = executeAgentTool('schedule_vehicle', {
      vehicle_id,
      stall_id,
      start,
      end,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/assign-detailing
app.post('/api/assign-detailing', validateRequest, (req, res) => {
  const { vehicle_id, bay_id, time_window } = req.body;

  // Validate required parameters
  if (!vehicle_id || !bay_id || !time_window) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'vehicle_id, bay_id, and time_window are required',
    });
  }

  if (typeof vehicle_id !== 'string' || typeof bay_id !== 'string' ||
      !time_window.start || !time_window.end) {
    return res.status(400).json({
      error: 'Invalid parameter format',
      message: 'vehicle_id and bay_id must be strings, time_window must have start and end',
    });
  }

  try {
    const result = executeAgentTool('assign_detailing', {
      vehicle_id,
      bay_id,
      time_window,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/optimize-charging-plan
app.post('/api/optimize-charging-plan', validateRequest, (req, res) => {
  const { depot_id, horizon_minutes = 120, objective = 'minimize_wait' } = req.body;

  if (!depot_id || typeof depot_id !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid depot_id parameter',
    });
  }

  if (horizon_minutes && (typeof horizon_minutes !== 'number' || horizon_minutes < 30 || horizon_minutes > 480)) {
    return res.status(400).json({
      error: 'Invalid horizon_minutes',
      message: 'horizon_minutes must be a number between 30 and 480',
    });
  }

  const validObjectives = ['minimize_wait', 'maximize_utilization', 'minimize_energy_cost'];
  if (objective && !validObjectives.includes(objective)) {
    return res.status(400).json({
      error: 'Invalid objective',
      message: `objective must be one of: ${validObjectives.join(', ')}`,
    });
  }

  try {
    const result = executeAgentTool('optimize_charging_plan', {
      depot_id,
      horizon_minutes,
      objective,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/utilization-report?depot_id=&start=&end=
app.get('/api/utilization-report', (req, res) => {
  const { depot_id, start, end } = req.query;

  if (!depot_id || !start || !end) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'depot_id, start, and end are required',
    });
  }

  if (typeof depot_id !== 'string' || typeof start !== 'string' || typeof end !== 'string') {
    return res.status(400).json({
      error: 'Invalid parameter types',
      message: 'All parameters must be strings',
    });
  }

  try {
    const result = executeAgentTool('utilization_report', {
      depot_id,
      start,
      end,
    });

    if (result.error) {
      res.status(400).json(result);
    } else {
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API documentation endpoint
app.get('/api/tools', (req, res) => {
  res.json({
    tools: agentTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /api/stalls',
      'GET /api/charging-queue',
      'POST /api/schedule-vehicle',
      'POST /api/assign-detailing',
      'POST /api/optimize-charging-plan',
      'GET /api/utilization-report',
      'GET /health',
      'GET /api/tools',
    ],
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 OttoCommand API server running on port ${PORT}`);
    console.log(`📖 API documentation available at http://localhost:${PORT}/api/tools`);
    console.log(`❤️  Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;