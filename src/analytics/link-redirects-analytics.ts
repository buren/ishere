import { isValidPathPattern } from '../utils/is-valid-path-pattern';
import { redirectsTable } from './track-link-redirect';

export type QueryJsonResponse = {
	meta: {
		name: string;
		type: string;
	}[];
	data: Record<string, string | number | boolean | null>[];
	rows: number;
	rows_before_limit_at_least: number;
};

export type RedirectStats = {
	totalRows: number;
	totalRedirects: number;
	botRedirects: number;
	nonBotRedirects: number;
	data: {
		id: string;
		datetime: string;
		totalRedirects: number;
		botRedirects: number;
		nonBotRedirects: number;
	}[];
};

type RedirectAnalyticsFilters = {
	id: string;
	groupBySeconds: number;
	excludeBotTraffic?: boolean;
};

export const linkRedirectsAnalytics = async (
	env: Env,
	{ id, groupBySeconds, excludeBotTraffic = false }: RedirectAnalyticsFilters
): Promise<RedirectStats> => {
	const tableName = 'REDIRECTS';

	// Validate id against the strict path pattern to prevent SQL injection
	if (isValidPathPattern(id) === false) {
		throw new Error('Invalid id');
	}

	if (groupBySeconds <= 0) {
		throw new Error('Invalid groupBySeconds, must be a positive number');
	}

	const isBotFilter = excludeBotTraffic ? ` AND ${redirectsTable.isBot} != 'true'` : '';
	const query = `
		SELECT
			toDateTime(intDiv(toUInt32(${redirectsTable.timestamp}), ${groupBySeconds}) * ${groupBySeconds}) AS datetime,
			${redirectsTable.id} as id,
			COUNT() as totalRedirects,
			SUM(IF(${redirectsTable.isBot} = 'true', 1, 0)) as botRedirects,
			SUM(IF(${redirectsTable.isBot} != 'true', 1, 0)) as nonBotRedirects
		FROM ${tableName}
		WHERE index1 = '${id}' ${isBotFilter}
		GROUP BY datetime, id
		ORDER BY datetime, id, totalRedirects DESC`;

	const API = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`;
	const response = await fetch(API, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.ANALYTICS_API_TOKEN}`,
		},
		body: query,
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error(`Error querying Analytics Engine (status ${response.status}):`, errorText);
		throw new Error('An error occurred while querying analytics data.');
	}

	const responseData = (await response.json()) as QueryJsonResponse;
	return {
		totalRows: responseData.rows,
		totalRedirects: responseData.data.reduce((sum, row) => sum + Number(row.totalRedirects), 0),
		botRedirects: responseData.data.reduce((sum, row) => sum + Number(row.botRedirects), 0),
		nonBotRedirects: responseData.data.reduce((sum, row) => sum + Number(row.nonBotRedirects), 0),
		data: responseData.data.map((row) => ({
			id: row.id as string,
			datetime: row.datetime as string,
			totalRedirects: Number(row.totalRedirects),
			botRedirects: Number(row.botRedirects),
			nonBotRedirects: Number(row.nonBotRedirects),
		})),
	};
};
