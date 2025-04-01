type HtmlPage = {
	title?: string;
	body: string;
}
const htmlPage = ({ title, body }: HtmlPage) => `<!doctype html>
<html>

<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<title>${title ? `${title} | ` : ''}IsHere</title>

	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
			line-height: 1.6;
			color: #333;
			background: linear-gradient(to bottom, #ffffff, #f5f5f5);
			min-height: 100vh;
			display: flex;
			align-items: start;
			justify-content: center;
			padding: 1rem;
		}

		.container {
			margin-top: 4rem;
			max-width: 480px;
			width: 100%;
			text-align: center;
			padding: 2rem;
			background-color: white;
			border-radius: 12px;
			box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
		}

		h1 {
			font-size: 2.5rem;
			font-weight: 700;
			margin-bottom: 1rem;
			line-height: 1.2;
		}

		.highlight {
			color: #05c46b;
		}

		p {
			color: #666;
			margin-bottom: 1.5rem;
		}
	</style>
</head>

<body>
	${body}
</body>

</html>`;

const container = (content: string) =>
	`<div class="container">${content}</div>`;

// 404 page
export const notFoundHtml = htmlPage({
	body: container(`
		<h1><span class="highlight">404</span> - Link Not Found</h1>

		<p>
			The shortened link you're looking for may have expired, been removed, or never existed.
		</p>
	`),
});

export type QrCodeHtmlOptions = { body: string; };

export const qrCodeHtml = ({ body }: QrCodeHtmlOptions) => `
<!DOCTYPE html>
<html>
<head>
	<title>IsHere | QR Code</title>

	<style>
		body {
			margin: 0;
			padding: 0;
		}

		img {
			max-width: 100%;
			height: auto;
		}
	</style>
</head>
<body>
	${body}
</body>
</html>`;
