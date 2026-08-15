import { Hono } from 'hono';

// Placeholder so the worker keeps bundling while the real public routes are
// built out in a concurrent session — replace with actual handlers.
const publicRoutes = new Hono();

export default publicRoutes;
