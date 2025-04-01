import { OpenAPIHono } from '@hono/zod-openapi';
import createLinkRoute from './create-link';
import deleteLinkRoute from './delete-link';
import getLinkRoute from './get-link';
import getLinkStatsRoute from './get-link-stats';
import updateLinkRoute from './update-link';
import apiKeyAuthMiddleware from '../../../middleware/auth';

const app = new OpenAPIHono<{ Bindings: Env }>();

// TODO we want to be more granular than this
// app.use('/api/link/*', apiKeyAuthMiddleware);

app.route('/', createLinkRoute);
app.route('/', deleteLinkRoute);
app.route('/', getLinkRoute);
app.route('/', getLinkStatsRoute);
app.route('/', updateLinkRoute);

export default app;
