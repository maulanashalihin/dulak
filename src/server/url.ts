/**
 * Parse a request URL defensively. `request.url` is guaranteed valid by the
 * fetch spec, so the fallback is pure insurance — it keeps a malformed URL
 * from crashing middleware that only needs the pathname/host.
 */
export function safeUrl(raw: string): URL {
	try {
		return new URL(raw);
	} catch {
		return new URL("http://localhost/");
	}
}
