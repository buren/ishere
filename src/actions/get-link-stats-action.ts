import StatusError from '../errors/status-error';
import { linkRedirectsAnalytics } from '../analytics/link-redirects-analytics';
import { Action, LinkAnalyticsGroupByOption } from '../types';
import { RedirectStats } from '../analytics/link-redirects-analytics';
import { isValidPathPattern } from '../utils/is-valid-path-pattern';
import { messages, durationInSeconds } from './constants';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';

type GetLinkStatsBody = {
	id: string;
	groupBy: string;
	excludeBotTraffic: boolean;
};

export const getLinkStatsAction: Action<GetLinkStatsBody, RedirectStats> = async ({ data, env, ctx }) => {
	const { id, groupBy } = data;

	if (isValidPathPattern(id) === false) {
		throw new StatusError(400, 'Invalid id', 'id', 'invalid_format');
	}

	if (!env.ACCOUNT_ID || !env.ANALYTICS_API_TOKEN) {
		throw new StatusError(503, 'Analytics is not configured. Set ACCOUNT_ID and ANALYTICS_API_TOKEN to enable.');
	}

	const value = await getLinkWithD1Fallback(env, id, ctx);
	if (value === null) {
		throw new StatusError(404, messages.notFound);
	}

	try {
		const groupBySeconds = durationInSeconds[groupBy as LinkAnalyticsGroupByOption];
		const analytics = await linkRedirectsAnalytics(env, { id, groupBySeconds });
		return {
			data: analytics,
		};
	} catch(error) {
		throw new StatusError(500, messages.internalServerError);
	}
};
