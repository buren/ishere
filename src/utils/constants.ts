// --- Short path generation ---

/** Minimum allowed length for a custom or generated short path */
export const minimumShortPathLength = 3;

/** Maximum allowed length for a custom short path */
export const maximumShortPathLength = 100;

/** Default length for auto-generated short paths */
export const defaultShortPathLength = 5;

/** Max attempts to generate a unique random short ID before giving up */
export const defaultMaxShortIdRetries = 5;

/** Allowed characters in a link ID: alphanumeric, hyphens, and underscores */
export const linkIdPattern = /^[a-zA-Z0-9_-]+$/;

// --- Namespaces ---

/** Maximum allowed length for a namespace prefix */
export const maximumNamespaceLength = 40;

// --- Links ---

/** Maximum allowed length for a destination URL */
export const maximumDestinationUrlLength = 8192;

/** Default HTTP status code used for redirects (302 Found) */
export const defaultRedirectStatusCode = 302;

/** Minimum expiration TTL in seconds (1 minute) */
export const minimumExpirationTtl = 60;

// --- Listing ---

/** Default number of links returned per list request */
export const defaultListLimit = 50;

/** Maximum number of links that can be returned per list request */
export const maximumListLimit = 100;

// --- QR codes ---

/** Minimum QR code image size in pixels */
export const minimumQrSize = 29;

/** Maximum QR code image size in pixels */
export const maximumQrSize = 1024;

/** Default QR code image size in pixels */
export const defaultQrSize = 200;

/** Minimum QR code quiet zone margin in pixels */
export const minimumQrMargin = 0;

/** Maximum QR code quiet zone margin in pixels */
export const maximumQrMargin = 100;

/** Default QR code quiet zone margin in pixels */
export const defaultQrMargin = 16;

// --- Webhooks ---

/**
 * Max retry attempts for webhook delivery.
 * Runs inside ctx.waitUntil() which has a 30s max lifetime.
 * With 3 retries and 1s base delay the worst case is ~7s (1s + 2s + 4s) plus fetch time.
 */
export const webhookMaxRetries = 3;

/** Base delay in ms for exponential backoff between webhook retries */
export const webhookRetryBaseDelayMs = 1000;

// --- Misc ---

/** KV key used by the health check endpoint */
export const HEALTH_KEY = 'health';

// --- Reserved paths ---

/** Paths that cannot be used as short link IDs to avoid collisions with app routes */
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
