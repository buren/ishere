export const minimumShortPathLength = 3;
export const maximumShortPathLength = 100;
export const defaultShortPathLength = 5;
export const defaultMaxShortIdRetries = 5;
export const maximumNamespaceLength = 40;
export const minimumExpirationTtl = 60;
export const linkIdPattern = /^[a-zA-Z0-9_-]+$/;
export const HEALTH_KEY = 'health';
export const defaultListLimit = 50;
export const maximumDestinationUrlLength = 8192;
export const minimumQrSize = 29;
export const maximumQrSize = 1024;
export const defaultQrSize = 200;
export const minimumQrMargin = 0;
export const maximumQrMargin = 100;
export const defaultQrMargin = 16;
export const maximumListLimit = 100;
export const defaultRedirectStatusCode = 302;
export const reservedPaths = [
	// Active routes
	'api',
	'qr',
	HEALTH_KEY,
	'docs',
	'openapi.json',
	'slack',

	// Browser/crawler conventions
	'favicon.ico',
	'robots.txt',
	'sitemap.xml',
	'.well-known',

	// Cloudflare internals
	'cdn-cgi',

	// Common web paths
	'about',
	'privacy',
	'terms',
	'tos',
	'help',
	'support',
	'status',

	// Auth
	'login',
	'logout',
	'auth',
	'oauth',
	'callback',

	// UI/admin
	'admin',
	'dashboard',
	'settings',
	'ui',
	'app',

	// Static assets
	'static',
	'assets',
	'public',
];
