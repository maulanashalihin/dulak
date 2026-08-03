/**
 * In-process SSR renderer. Runs inside the Elysia process (no separate
 * SSR server): renders the page component tree to HTML with react-dom/server.
 */
import { createInertiaApp } from '@inertiajs/react'
import type { Page } from '@inertiajs/core'
import { renderToString } from 'react-dom/server'
import { notFoundPage, pages } from './pages'

export async function renderPage(page: Page) {
  return createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => pages[`./pages/${name}.tsx`]?.default ?? notFoundPage!,
    setup: ({ App, props }) => <App {...props} />,
    title: (title: string) => (title ? `${title} — Elysia Inertia` : 'Elysia Inertia'),
  })
}
