import { dbGetLinksByNamespace } from '../db';
import { linkWithUrl } from '../utils/link-with-url';
import { Action } from '../types';

export const listLinksByNamespaceAction: Action = async ({ data, url, env }) => {
	const { links, total } = await dbGetLinksByNamespace(env.D1, {
		namespace: data.namespace,
		limit: data.limit,
		offset: data.offset,
	});

	return {
		data: {
			data: links.map((link) => linkWithUrl(url, link)),
			total,
			limit: data.limit,
			offset: data.offset,
		},
	};
};
