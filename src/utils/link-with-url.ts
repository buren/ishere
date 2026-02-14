import { LinkKVSchema } from '../types';

export type LinkWithUrls = Omit<LinkKVSchema, 'password'> & {
	url: string;
	qrUrl: string;
	passwordProtected: boolean;
};

export const linkWithUrl = (url: string, link: LinkKVSchema): LinkWithUrls => {
	const origin = new URL(url).origin;
	const { password, ...rest } = link;
	const passwordProtected = !!password;

	if (link.namespace) {
		const idWithoutNamespace = link.id.slice(link.namespace.length + 1);
		return {
			...rest,
			passwordProtected,
			url: `${origin}/${link.namespace}/${idWithoutNamespace}`,
			qrUrl: `${origin}/${link.namespace}/${idWithoutNamespace}/qr`,
		};
	}

	return {
		...rest,
		passwordProtected,
		url: `${origin}/${link.id}`,
		qrUrl: `${origin}/${link.id}/qr`,
	};
};
