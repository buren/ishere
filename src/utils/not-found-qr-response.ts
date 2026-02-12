import { notFoundHtml } from '../html';

const notFoundSvg = (size = 200) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="#f5f5f5"/>
<text x="50%" y="45%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#999">404</text>
<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="13" fill="#999">Not Found</text>
</svg>`;

export const notFoundQrResponse = (format: string = 'svg'): { body: string; contentType: string } => {
	if (format === 'html') {
		return { body: notFoundHtml, contentType: 'text/html' };
	}

	// SVG placeholder for both svg and png formats (no server-side PNG rendering available)
	return { body: notFoundSvg(), contentType: 'image/svg+xml' };
};
