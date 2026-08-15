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

// Middleware
app.use('/*', cors());

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
