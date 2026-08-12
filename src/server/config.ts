/**
 * Centralised, validated configuration. Reads process.env once at startup
 * and fails fast with a clear message when the active setup is incomplete
 * (e.g. MAIL_DRIVER=resend without RESEND_API_KEY).
 *
 * Note: tests override env vars before importing modules, so config is
 * always derived fresh per process.
 */
export type MailDriver = "log" | "resend" | "mailtrap";
export type Role = "user" | "admin";

const pick = <T>(value: T | undefined, fallback: T): T =>
	value === undefined || value === "" ? fallback : value;

const problems: string[] = [];

const mailDriver = (
	process.env.MAIL_DRIVER ?? "log"
).toLowerCase() as MailDriver;
if (!["log", "resend", "mailtrap"].includes(mailDriver)) {
	problems.push(
		`MAIL_DRIVER must be one of log|resend|mailtrap (got "${mailDriver}")`,
	);
}
const resendApiKey = process.env.RESEND_API_KEY ?? "";
if (mailDriver === "resend" && !resendApiKey)
	problems.push("MAIL_DRIVER=resend requires RESEND_API_KEY");
const mailtrapToken = process.env.MAILTRAP_API_TOKEN ?? "";
if (mailDriver === "mailtrap" && !mailtrapToken)
	problems.push("MAIL_DRIVER=mailtrap requires MAILTRAP_API_TOKEN");

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
	problems.push(
		"GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together (Google OAuth stays disabled otherwise)",
	);
}

if (problems.length > 0) {
	throw new Error(`Invalid configuration:\n  - ${problems.join("\n  - ")}`);
}

export const config = {
	isProd: process.env.NODE_ENV === "production",
	/** Server-side rendering of Inertia pages. Set SSR=false to ship an empty
	 *  shell and let the client render (faster boot, no react-dom/server cost). */
	ssr: process.env.SSR !== "false",
	port: Number(pick(process.env.PORT, "4000")),
	/** Absolute base URL — used for email links and OAuth redirect URIs. */
	appUrl: pick(process.env.APP_URL, "http://localhost:4000").replace(
		/\/+$/,
		"",
	),
	dbPath: pick(process.env.DATABASE_PATH, "./data/app.sqlite"),
	upload: {
		/** Directory where tus upload chunks are stored on disk. */
		dir: pick(process.env.UPLOAD_DIR, "./data/uploads"),
		/** Maximum total upload size in bytes (Tus-Max-Size). 0 = unlimited. */
		maxSize: Number(pick(process.env.TUS_MAX_SIZE, "0")),
		/** Seconds after which an unfinished upload may be swept (Expiration). 0 = no expiry. */
		expirationSeconds: Number(pick(process.env.TUS_EXPIRATION_SECONDS, "0")),
	},
	mail: {
		driver: mailDriver,
		from: pick(process.env.MAIL_FROM, "no-reply@example.com"),
		resendApiKey,
		mailtrapToken,
		mailtrapInboxId: process.env.MAILTRAP_INBOX_ID ?? "",
	},
	google: {
		clientId: googleClientId || null,
		clientSecret: googleClientSecret || null,
	},
	rateLimit: {
		/** Per-IP limit applied to all routes (DDoS baseline). Excludes
		 *  /health and /assets/* (health probes + bulk asset fetches). */
		globalMax: Number(pick(process.env.RATE_LIMIT_GLOBAL_MAX, "200")),
		globalWindow: Number(pick(process.env.RATE_LIMIT_GLOBAL_WINDOW, "60")),
		/** Stricter per-IP limit layered on auth endpoints (brute-force). */
		authMax: Number(pick(process.env.RATE_LIMIT_AUTH_MAX, "30")),
		authWindow: Number(pick(process.env.RATE_LIMIT_AUTH_WINDOW, "60")),
	},
	/** Optional bearer token for /metrics. If set, scrape endpoints must
	 *  send `Authorization: Bearer <token>`. If unset, /metrics is restricted
	 *  to loopback only (Prometheus scrapes locally in single-server deploys). */
	metricsToken: process.env.METRICS_TOKEN ?? "",
};
