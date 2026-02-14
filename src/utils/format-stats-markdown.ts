import { RedirectStats } from '../analytics/link-redirects-analytics';

export const formatStatsMarkdown = (analytics: RedirectStats, linkId?: string): string => {
	const lastSeven = analytics.data.slice(-7);
	const shortStats = lastSeven
		.map((row) => {
			const date = row.datetime.split(' ')[0];
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
	const header = linkId
		? `*:bar_chart: Redirect stats for \`${linkId}\`*`
		: '*:bar_chart: Redirect stats*';

	return `${header}\n${shortStats.join('\n')}\n\nLast 7 days: ${totalLastSeven}\nLast 3 months: ${analytics.totalRedirects}`;
};
