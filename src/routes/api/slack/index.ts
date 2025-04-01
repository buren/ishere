import { OpenAPIHono } from '@hono/zod-openapi';
import commandRoute from './command';

const app = new OpenAPIHono<{ Bindings: Env }>();

app.route('/', commandRoute);

export default app;
