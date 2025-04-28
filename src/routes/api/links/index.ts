import { OpenAPIHono } from '@hono/zod-openapi';
import createLinkRoute from './create-link';
import deleteLinkRoute from './delete-link';
import getLinkRoute from './get-link';
import getLinkStatsRoute from './get-link-stats';
import updateLinkRoute from './update-link';

const app = new OpenAPIHono<{ Bindings: Env }>();

// Link API routes
app.route('/', createLinkRoute);
app.route('/', deleteLinkRoute);
app.route('/', getLinkRoute);
app.route('/', getLinkStatsRoute);
app.route('/', updateLinkRoute);

export default app;
