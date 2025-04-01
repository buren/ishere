interface Env {
	// App environment
	ENVIRONMENT: 'development' | 'production';

	// API Token for managing links
	API_TOKEN: string;

	// Cloudflare KV store binding
	KV: KVNamespace;

	// Cloudflare D1 database binding
	D1: D1Database;

	// Clouflare Analytics API token
	ANALYTICS_API_TOKEN: string;

	// Cloudflare Account Id
	ACCOUNT_ID: string;

	// Binding to Cloudflare Analytics
	REDIRECTS: AnalyticsEngineDataset;
	REDIRECTS_DEV: AnalyticsEngineDataset;
}
