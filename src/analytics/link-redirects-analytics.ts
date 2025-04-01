import { isValidPathPattern } from '../utils/is-valid-path-pattern';

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
	data: {
		id: string;
		datetime: string;
		totalRedirects: number;
	}[];
};

export const linkRedirectsAnalytics = async (
	env: Env,
	{ id, groupBySeconds }: { id: string; groupBySeconds: number },
): Promise<RedirectStats> => {
	const tableName = env.ENVIRONMENT === 'development' ? 'REDIRECTS_DEV' : 'REDIRECTS';

	// Validate id against the strict path pattern to prevent SQL injection
	if (isValidPathPattern(id) === false) {
		throw new Error('Invalid id');
	}

	if (groupBySeconds <= 0) {
		throw new Error('Invalid groupBySeconds, must be a positive number');
	}

	const query = `
		SELECT
			toDateTime(intDiv(toUInt32(timestamp), ${groupBySeconds}) * ${groupBySeconds}) AS datetime,
			blob1 as id,
			COUNT() as totalRedirects
		FROM ${tableName}
		WHERE blob1 = '${id}'
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
		data: responseData.data.map((row) => ({
			id: row.id as string,
			datetime: row.datetime as string,
			totalRedirects: Number(row.totalRedirects),
		})),
	};
};
