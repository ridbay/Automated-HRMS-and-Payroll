import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'

import { AppEnv } from './types';
import employeeRoutes from './routes/employee.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import supportRoutes from './routes/support.routes';

const app = new Hono<AppEnv>();

// Isolate instrumentation for the response-time evaluation
// (scripts/measure-response-times.mjs). Module scope lives as long as the
// isolate, so X-Isolate-Request: 1 marks a request served by a fresh (cold)
// isolate. Server-Timing reports time spent inside the Worker; Workers only
// advance the clock across I/O, so this is effectively D1/R2/AI wait time.
let isolateRequestCount = 0;
app.use('/*', async (c, next) => {
  const requestNumber = ++isolateRequestCount;
  const startedAt = Date.now();
  await next();
  c.header('X-Isolate-Request', String(requestNumber));
  c.header('Server-Timing', `app;dur=${Date.now() - startedAt}`);
});

// Middleware
app.use('/*', cors({ exposeHeaders: ['X-Isolate-Request', 'Server-Timing'] }));

// Health Check
app.get('/health', (c) => c.text('OK'));

// Routes
app.route('/auth', authRoutes);
app.route('/public', publicRoutes);
app.route('/employee', employeeRoutes);
app.route('/admin', adminRoutes);
app.route('/ai', aiRoutes);
app.route('/support', supportRoutes);

export default app;
