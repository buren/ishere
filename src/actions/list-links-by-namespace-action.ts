import { dbGetLinksByNamespace } from '../db';
import { linkWithUrl } from '../utils/link-with-url';
import { Action } from '../types';
import { LinkWithUrls } from '../utils/link-with-url';

type ListLinksByNamespaceBody = {
	namespace: string;
	limit: number;
	offset: number;
};

type ListLinksByNamespaceResponse = {
	data: LinkWithUrls[];
	total: number;
	limit: number;
	offset: number;
};

export const listLinksByNamespaceAction: Action<ListLinksByNamespaceBody, ListLinksByNamespaceResponse> = async ({ data, url, env }) => {
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
