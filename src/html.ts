type HtmlPage = {
	title?: string;
	body: string;
}
export const htmlPage = ({ title, body }: HtmlPage) => `<!doctype html>
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

export const bodyContainer = (content: string) =>
	`<div class="container">${content}</div>`;

// 404 page
export const notFoundHtml = htmlPage({
	body: bodyContainer(`
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

export const scheduledNotActiveHtml = (scheduledAt: string) =>
	htmlPage({
		title: 'Not Yet Available',
		body: bodyContainer(`
			<h1>Not Yet <span class="highlight">Available</span></h1>
			<p>This link is scheduled to go live on:</p>
			<div id="countdown" style="font-size: 1.4rem; font-weight: 700; min-height: 2rem;"></div>
			<p style="font-weight: 600; font-size: 1.1rem;">${scheduledAt}</p>
			<script>
			(function(){
				var target = new Date("${scheduledAt}").getTime();
				var el = document.getElementById("countdown");
				function pad(n){ return n < 10 ? "0" + n : n; }
				function update(){
					var now = Date.now();
					var diff = target - now;
					if(diff <= 0){ el.textContent = "Live now! Redirecting..."; location.reload(); return; }
					var s = Math.floor(diff / 1000);
					var m = Math.floor(s / 60); s %= 60;
					var h = Math.floor(m / 60); m %= 60;
					var d = Math.floor(h / 24); h %= 24;
					var mo = 0, y = 0;
					var dt = new Date(now);
					while(true){
						var next = new Date(dt); next.setMonth(next.getMonth() + 1);
						if(next.getTime() > target) break;
						dt = next; mo++;
					}
					y = Math.floor(mo / 12); mo %= 12;
					var remaining = target - dt.getTime();
					d = Math.floor(remaining / 86400000);
					h = Math.floor((remaining % 86400000) / 3600000);
					m = Math.floor((remaining % 3600000) / 60000);
					s = Math.floor((remaining % 60000) / 1000);
					var parts = [];
					if(y) parts.push(y + (y === 1 ? " year" : " years"));
					if(mo) parts.push(mo + (mo === 1 ? " month" : " months"));
					if(d) parts.push(d + (d === 1 ? " day" : " days"));
					if(h) parts.push(pad(h) + "h");
					if(m) parts.push(pad(m) + "m");
					if(s) parts.push(pad(s) + "s");
					el.textContent = parts.join(" ");
				}
				update();
				setInterval(update, 1000);
			})();
			</script>
		`),
	});

export const linkPreviewHtml = (link: import('./utils/link-with-url').LinkWithUrls) => {
	const rows = [
		`<tr><td>Destination</td><td><a href="${link.destinationUrl}">${link.destinationUrl}</a></td></tr>`,
		`<tr><td>Short URL</td><td><a href="${link.url}">${link.url}</a></td></tr>`,
		link.namespace ? `<tr><td>Namespace</td><td>${link.namespace}</td></tr>` : '',
		link.passwordProtected ? `<tr><td>Password</td><td>Protected</td></tr>` : '',
		link.scheduledAt ? `<tr><td>Scheduled</td><td>${link.scheduledAt}</td></tr>` : '',
		`<tr><td>Redirect</td><td>${link.redirectStatusCode === 301 ? '301 Permanent' : '302 Temporary'}</td></tr>`,
		`<tr><td>Created</td><td>${link.createdAt}</td></tr>`,
		`<tr><td>Updated</td><td>${link.updatedAt}</td></tr>`,
		link.expiresAt ? `<tr><td>Expires</td><td>${link.expiresAt}</td></tr>` : '',
	].filter(Boolean).join('\n\t\t\t');

	return htmlPage({
		title: 'Link Preview',
		body: bodyContainer(`
			<h1>Link <span class="highlight">Preview</span></h1>
			<img src="${link.qrUrl}" alt="QR code" width="200" height="200" style="margin-bottom: 1rem;" />
			<table style="width: 100%; text-align: left; border-collapse: collapse;">
			${rows}
			</table>
			<style>
				td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
				td:first-child { font-weight: 600; white-space: nowrap; color: #555; }
				td a { color: #05c46b; word-break: break-all; }
			</style>
		`),
	});
};

export const passwordPromptHtml = (actionUrl: string, error?: string) =>
	htmlPage({
		title: 'Password Required',
		body: bodyContainer(`
			<h1>Password <span class="highlight">Required</span></h1>
			<p>This link is password-protected. Enter the password to continue.</p>
			${error ? `<p style="color: #e74c3c; font-weight: 600;">${error}</p>` : ''}
			<form method="POST" action="${actionUrl}">
				<input type="password" name="password" placeholder="Enter password" required
					style="width: 100%; padding: 0.6rem; font-size: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; margin-bottom: 1rem;" />
				<button type="submit"
					style="width: 100%; padding: 0.6rem; font-size: 1rem; background: #05c46b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
					Continue
				</button>
			</form>
		`),
	});

export const homePageHtml = (docsPath: string) =>
	htmlPage({
		title: 'IsHere | Short Links',
		body: bodyContainer(`
			<h1>IsHere</h1>
			<p>Simple, blazing fast, yet powerful link shortening service.</p>
			<p><a href="${docsPath}">API documentation</a></p>
		`),
	});
