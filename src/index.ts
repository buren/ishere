import app from './routes';
import { dbDeleteOldLinks } from './db';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
	async scheduled(event, env, ctx) {
		ctx.waitUntil(dbDeleteOldLinks(env.D1));
	},
} satisfies ExportedHandler<Env>;
