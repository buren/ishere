export type LinkKVSchema = {
	destinationUrl: string;
	id: string;
	namespace?: string | null;
	createdAt: string;
	updatedAt: string;
	expirationTtl: number | null;
};

export type LinkDbSchema = LinkKVSchema;

export type LinkAnalyticsGroupByOption = 'day' | 'hour';

type ActionContext<TBody = unknown> = {
	url: string;
	data: TBody;
	env: Env;
	ctx: { waitUntil(promise: Promise<unknown>): void; };
};

type ActionResult<T> = {
	data: T;
	waitFor?: Promise<any>[];
};

export type Action<TBody = any, TResponseBody = any> = (
	context: ActionContext<TBody>
) => Promise<ActionResult<TResponseBody>>;
