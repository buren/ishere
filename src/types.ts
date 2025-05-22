/**
 * Constructs a type that makes properties specified in `K` optional, while the rest remain the same.
 *
 * @template T - The original type to be transformed.
 * @template K - The keys of the properties to be made optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type LinkKVSchema = {
	destinationUrl: string;
	id: string;
	namespace?: string | null;
	createdAt: string;
	updatedAt: string;
	expiresAt: string | null;
	expirationTtl?: number | null;
};

export type LinkDbSchema = LinkKVSchema;

export type LinkAnalyticsGroupByOption = 'day' | 'hour';

type ActionContext<TBody = unknown> = {
	url: string;
	data: TBody;
	env: Env;
	ctx: { waitUntil(promise: Promise<unknown>): void };
};

type ActionResult<T> = {
	data: T;
	waitFor?: Promise<any>[];
};

export type Action<TBody = any, TResponseBody = any> = (context: ActionContext<TBody>) => Promise<ActionResult<TResponseBody>>;
