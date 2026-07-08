import { Hono } from 'hono';
import adminRoutes from './admin.routes';
import employeeRoutes from './employee.routes';

const rootRouter = new Hono();

rootRouter.route('/admin', adminRoutes);
rootRouter.route('/employee', employeeRoutes);

export default rootRouter;
