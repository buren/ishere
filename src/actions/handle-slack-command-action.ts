import StatusError from '../errors/status-error';
import { linkRedirectsAnalytics } from '../analytics/link-redirects-analytics';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { linkWithUrl } from '../utils/link-with-url';
import { parseSlackCommand, SLACK_COMMAND_USAGE_MRKDWN } from '../utils/parse-slack-command';
import { slackRespondWithMarkdown, slackRespondWithMessage } from '../utils/slack-respond-with';
import { durationInSeconds } from './constants';
import { createLinkAction } from './create-link-action';
import { updateLinkAction } from './update-link-action';
import { defaultShortPathLength } from '../utils/constants';
import { kvGetLink } from '../kv';

type SlackCommandAction = {
	text: string;
	url: string;
	env: Env;
	ctx: {
		waitUntil(promise: Promise<unknown>): void
	};
};

export const handleSlackCommandAction = async ({ text, url: requestUrl, env, ctx }: SlackCommandAction) => {
	console.log('Handling Slack command:', text);
	const { command, id, shortPath, destinationUrl, namespace } = parseSlackCommand(text);
	console.log('Slack command parsed:', { command, id, destinationUrl, namespace });

	if (command === 'help') {
		return slackRespondWithMarkdown(SLACK_COMMAND_USAGE_MRKDWN);
	} else if (command === 'stats') {
		const value = id ? await kvGetLink(env.KV, id) : null;
		if (!id || value === null) {
			return slackRespondWithMessage('No link with that id exists.');
		}

		try {
			const analytics = await linkRedirectsAnalytics(env, { id, groupBySeconds: durationInSeconds.day });

			if (!analytics || !analytics.data || analytics.data.length === 0) {
				return slackRespondWithMessage('No stats for that link, yet...');
			}

			const lastSeven = analytics.data.slice(-7);
			const shortStats = lastSeven
				.map((row) => {
					const date = row.datetime.split(' ')[0]; // yyyy-mm-dd
					const entryDate = new Date(date);

					const sevenDaysAgo = new Date();
					sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
					sevenDaysAgo.setHours(0, 0, 0, 0);

					if (entryDate < sevenDaysAgo) {
						return null;
					}

					return `- ${date}: ${row.totalRedirects}`;
				})
				.filter(Boolean);

			const totalLastSeven = lastSeven.reduce((sum, row) => sum + Number(row.totalRedirects), 0);
			const markdown = `*:bar_chart: Redirect stats*\n${shortStats.join("\n")}\n\nLast 7 days: ${totalLastSeven}\nLast 3 months: ${
				analytics.totalRedirects
			}`;

			return slackRespondWithMarkdown(markdown);
		} catch (_) {
			return slackRespondWithMessage('Sorry, something went wrong.');
		}
	} else if (command === 'get') {
		if (!id) {
			return slackRespondWithMessage('No id provided.');
		}

		const link = await getLinkWithD1Fallback(env, id);
		if (!link) {
			return slackRespondWithMessage('No link with that id exists.');
		}

		const { url, destinationUrl } = linkWithUrl(requestUrl, link);
		return slackRespondWithMarkdown(`:link: ${url} redirects to ${destinationUrl}`);
	} else if (command === 'create') {
		try {
			const {
				data,
				waitFor = [],
			} = await createLinkAction({
				data: {
					destinationUrl: destinationUrl as string,
					shortPath: shortPath as string,
					namespace: namespace as string,
					length: defaultShortPathLength,
				},
				url: requestUrl,
				env,
				ctx,
			});

			waitFor.forEach((promise) => ctx.waitUntil(promise)); // needs to be explicitly iterated over

			return slackRespondWithMarkdown(`:link: ${data.url} redirects to ${data.destinationUrl}`);
		} catch (error) {
			if (error instanceof StatusError) {
				return slackRespondWithMessage(error.message);
			}

			console.error(error);
			return slackRespondWithMessage('Sorry, something went wrong.');
		}
	} else if (command === 'update') {
		try {
			const { data } = await updateLinkAction({
				data: {
					id: id as string,
					destinationUrl: destinationUrl as string,
				},
				url: requestUrl,
				env,
				ctx,
			});

			return slackRespondWithMarkdown(`:link: Updated, now ${data.url} redirects to ${data.destinationUrl}`);
		}	catch (error)	{
			if (error instanceof StatusError) {
				return slackRespondWithMessage(error.message);
			}

			console.error(error);
			return slackRespondWithMessage('Sorry, something went wrong.');
		}
	} else {
		return slackRespondWithMessage('Invalid command. Use /ishere help for available commands.');
	}
};
