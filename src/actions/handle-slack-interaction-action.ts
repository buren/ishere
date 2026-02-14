import { linkRedirectsAnalytics } from '../analytics/link-redirects-analytics';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { formatStatsMarkdown } from '../utils/format-stats-markdown';
import { linkWithUrl } from '../utils/link-with-url';
import { slackRespondToUrl } from '../utils/slack-api';
import { slackRespondWithMarkdown, slackRespondWithMessage } from '../utils/slack-respond-with';
import { durationInSeconds } from './constants';

type SlackInteractionPayload = {
	type: string;
	response_url: string;
	actions: {
		action_id: string;
		value: string;
	}[];
};

type HandleSlackInteractionParams = {
	payload: SlackInteractionPayload;
	requestUrl: string;
	env: Env;
};

export const handleSlackInteractionAction = async ({
	payload,
	requestUrl,
	env,
}: HandleSlackInteractionParams): Promise<void> => {
	const action = payload.actions?.[0];
	if (!action) return;

	const { action_id, value: linkId } = action;
	const responseUrl = payload.response_url;

	try {
		if (action_id === 'view_stats') {
			await handleViewStats(linkId, responseUrl, env);
		} else if (action_id === 'view_details') {
			await handleViewDetails(linkId, responseUrl, requestUrl, env);
		} else if (action_id === 'edit_destination') {
			await handleEditDestination(linkId, responseUrl);
		}
	} catch (error) {
		console.error('Error handling Slack interaction:', error);
		await slackRespondToUrl(responseUrl, {
			...slackRespondWithMessage('Sorry, something went wrong.'),
			replace_original: false,
		});
	}
};

const handleViewStats = async (linkId: string, responseUrl: string, env: Env) => {
	if (!env.ACCOUNT_ID || !env.ANALYTICS_API_TOKEN) {
		await slackRespondToUrl(responseUrl, {
			...slackRespondWithMessage('Analytics is not configured.'),
			replace_original: false,
		});
		return;
	}

	try {
		const analytics = await linkRedirectsAnalytics(env, { id: linkId, groupBySeconds: durationInSeconds.day });

		if (!analytics || !analytics.data || analytics.data.length === 0) {
			await slackRespondToUrl(responseUrl, {
				...slackRespondWithMessage('No stats for that link, yet...'),
				replace_original: false,
			});
			return;
		}

		await slackRespondToUrl(responseUrl, {
			...slackRespondWithMarkdown(formatStatsMarkdown(analytics, linkId)),
			replace_original: false,
		});
	} catch (error) {
		console.error('Error fetching stats for Slack interaction:', error);
		await slackRespondToUrl(responseUrl, {
			...slackRespondWithMessage('Failed to fetch stats.'),
			replace_original: false,
		});
	}
};

const handleViewDetails = async (linkId: string, responseUrl: string, requestUrl: string, env: Env) => {
	const link = await getLinkWithD1Fallback(env, linkId);
	if (!link) {
		await slackRespondToUrl(responseUrl, {
			...slackRespondWithMessage('No link with that id exists.'),
			replace_original: false,
		});
		return;
	}

	const { url, qrUrl, destinationUrl } = linkWithUrl(requestUrl, link);
	const namespace = link.namespace ?? 'none';
	const ttl = link.expirationTtl ? `${link.expirationTtl}s` : 'none';
	const expiresAt = link.expiresAt ?? 'none';

	const markdown = [
		`*:mag: Link details*`,
		`*ID:* ${link.id}`,
		`*Destination:* ${destinationUrl}`,
		`*Short URL:* ${url}`,
		`*QR URL:* ${qrUrl}`,
		`*Namespace:* ${namespace}`,
		`*TTL:* ${ttl}`,
		`*Expires at:* ${expiresAt}`,
		`*Created at:* ${link.createdAt}`,
		`*Updated at:* ${link.updatedAt}`,
	].join('\n');

	await slackRespondToUrl(responseUrl, {
		...slackRespondWithMarkdown(markdown),
		replace_original: false,
	});
};

const handleEditDestination = async (linkId: string, responseUrl: string) => {
	await slackRespondToUrl(responseUrl, {
		...slackRespondWithMessage(`To update the destination, use: \`/ishere update ${linkId} <new-url>\``),
		replace_original: false,
	});
};
