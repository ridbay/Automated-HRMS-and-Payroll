import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'

import { AppEnv } from './types';
import rootRouter from './routes/index';

const app = new Hono<AppEnv>();

app.use('*', cors())

app.get('/', (c) => {
  return c.json({ message: 'Welcome to the ZenHR API!' })
})

app.route('/', rootRouter)

export default app
