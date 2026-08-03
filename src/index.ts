/**
 * Entry point. Builds client assets on first run / in dev, then serves.
 *   bun run dev    → watch mode, rebuilds assets on restart
 *   bun run build  → prebuild assets for production
 *   bun run start  → serve prebuilt assets (NODE_ENV=production)
 */
import { buildClientAssets, loadManifest, manifestExists } from './server/assets'
import { createApp } from './server/app'

const isProd = process.env.NODE_ENV === 'production'
if (!isProd || !manifestExists()) {
  await buildClientAssets()
}

const assets = loadManifest()
const port = Number(process.env.PORT ?? 3000)

createApp(assets).listen(port)
console.log(`Elysia Inertia boilerplate → http://localhost:${port}`)
