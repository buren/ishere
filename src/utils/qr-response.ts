import { qrCodeHtml } from '../html';
import parseQrQuery from './parse-qr-query';
import qrFactory from './qr-factory';

const qrResponse = async (url: string, query: Record<string, string | string[] | undefined>) => {
	const { format = 'svg', ...qrOptions } = parseQrQuery(query);
	const { svgTag, pngBuffer } = qrFactory(url, qrOptions);

	if (format === 'png') {
		return {
			body: await pngBuffer(),
			contentType: 'image/png',
		};
	}

	if (format === 'html') {
		return {
			body: qrCodeHtml({ body: svgTag() }),
			contentType: 'text/html',
		};
	}

	return {
		body: svgTag(),
		contentType: 'image/svg+xml',
	};
};

export default qrResponse;
