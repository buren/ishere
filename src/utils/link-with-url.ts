import { LinkKVSchema } from '../types';

export type LinkWithUrls = LinkKVSchema & {
	url: string;
	qrUrl: string;
};

export const linkWithUrl = (url: string, link: LinkKVSchema) => {
	const origin = new URL(url).origin;
	if (link.namespace) {
		const idWithoutNamespace = link.id.slice(link.namespace.length + 1);
		return {
			...link,
			url: `${origin}/${link.namespace}/${idWithoutNamespace}`,
			qrUrl: `${origin}/${link.namespace}/${idWithoutNamespace}/qr`,
		};
	}

	return {
		...link,
		url: `${origin}/${link.id}`,
		qrUrl: `${origin}/${link.id}/qr`,
	};
};
