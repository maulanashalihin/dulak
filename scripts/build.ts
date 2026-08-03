/**
 * `bun run build` — prebuild client assets for production.
 * Assets land in dist/ with content-hashed names + dist/manifest.json.
 */
import { buildClientAssets } from '../src/server/assets'

await buildClientAssets()
