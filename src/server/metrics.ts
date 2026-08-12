/**
 * In-memory Prometheus/OpenMetrics metrics — zero dependencies.
 *
 * Exposes /metrics with:
 *  - http_requests_total: counter by method, path, status
 *  - http_request_duration_seconds: histogram by path (buckets 1ms→10s)
 *  - active_sessions: gauge (queried from DB on scrape)
 *
 * Counters are in-memory (per-process). For horizontal scaling, use a
 * shared store (Redis) or external Prometheus push gateway. The gauge
 * is lazy — only queried when /metrics is scraped, not on every request.
 *
 * The OpenMetrics text format is intentionally simple; Prometheus scrapes
 * it every 15–60s. No prom-client dependency needed.
 */
import { pingDb, db } from "./db";

interface Counter {
	value: number;
}

interface HistogramBucket {
	le: number; // less-than-or-equal upper bound (seconds)
	count: number;
}

interface Histogram {
	buckets: HistogramBucket[];
	sum: number;
	count: number;
}

const BUCKETS = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10];

const requestCounters = new Map<string, Counter>();
const requestHistograms = new Map<string, Histogram>();

function counterKey(method: string, path: string, status: number): string {
	return `${method} ${path} ${status}`;
}

function normalizePath(path: string): string {
	// Collapse /uploads/:id and /assets/<hash> into parameterized routes
	// so the cardinality stays bounded (not one counter per upload id).
	if (path.startsWith("/uploads/")) return "/uploads/:id";
	if (path.startsWith("/assets/")) return "/assets/*";
	if (path.startsWith("/.well-known/")) return "/.well-known/*";
	return path;
}

/** Record a request — called from the metrics middleware after next(). */
export function recordRequest(
	method: string,
	rawPath: string,
	status: number,
	durationSeconds: number,
): void {
	const path = normalizePath(rawPath);
	const key = counterKey(method, path, status);
	let counter = requestCounters.get(key);
	if (!counter) {
		counter = { value: 0 };
		requestCounters.set(key, counter);
	}
	counter.value += 1;

	let hist = requestHistograms.get(path);
	if (!hist) {
		hist = {
			buckets: BUCKETS.map((le) => ({ le, count: 0 })),
			sum: 0,
			count: 0,
		};
		requestHistograms.set(path, hist);
	}
	hist.sum += durationSeconds;
	hist.count += 1;
	for (const bucket of hist.buckets) {
		if (durationSeconds <= bucket.le) bucket.count += 1;
	}
}

/** Count active sessions (gauge — queried lazily on /metrics scrape). */
function activeSessions(): number {
	try {
		const row = db.query<{ n: number }, []>(
			`SELECT COUNT(*) AS n FROM sessions WHERE expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
		).get();
		return row?.n ?? 0;
	} catch {
		return 0;
	}
}

/** Render the OpenMetrics text format for /metrics. */
export function renderMetrics(): string {
	const lines: string[] = [];

	// http_requests_total
	lines.push("# HELP http_requests_total Total HTTP requests by method, path, status");
	lines.push("# TYPE http_requests_total counter");
	for (const [key, counter] of requestCounters) {
		const [method, path, status] = key.split(" ");
		lines.push(
			`http_requests_total{method="${method}",path="${path}",status="${status}"} ${counter.value}`,
		);
	}

	// http_request_duration_seconds
	lines.push("# HELP http_request_duration_seconds Request latency histogram by path");
	lines.push("# TYPE http_request_duration_seconds histogram");
	for (const [path, hist] of requestHistograms) {
		for (const bucket of hist.buckets) {
			lines.push(
				`http_request_duration_seconds_bucket{path="${path}",le="${bucket.le}"} ${bucket.count}`,
			);
		}
		lines.push(
			`http_request_duration_seconds_bucket{path="${path}",le="+Inf"} ${hist.count}`,
		);
		lines.push(`http_request_duration_seconds_sum{path="${path}"} ${hist.sum}`);
		lines.push(`http_request_duration_seconds_count{path="${path}"} ${hist.count}`);
	}

	// active_sessions (gauge)
	lines.push("# HELP active_sessions Currently active (non-expired) sessions");
	lines.push("# TYPE active_sessions gauge");
	lines.push(`active_sessions ${activeSessions()}`);

	// db_liveness (gauge — 1 if DB responds, 0 if not)
	lines.push("# HELP db_liveness Database liveness (1=up, 0=down)");
	lines.push("# TYPE db_liveness gauge");
	try {
		pingDb.get();
		lines.push("db_liveness 1");
	} catch {
		lines.push("db_liveness 0");
	}

	return `${lines.join("\n")}\n`;
}
