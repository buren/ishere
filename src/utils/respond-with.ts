export const respondWith = (status: number, payload: Record<string, any>) =>
	new Response(JSON.stringify(payload), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

