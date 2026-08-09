/**
 * OG image generator — build-time static route.
 *
 * /og/[...slug].png — slug matches the content collection entry slug
 * (e.g. "deployment/docker" → /og/deployment/docker.png).
 *
 * Generates a 1200×630 PNG with the page title, description, and Dulak
 * branding via Satori (HTML/CSS → SVG) + resvg (SVG → PNG).
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { getCollection } from "astro:content";

const ROOT = process.cwd();

/**
 * Brand URL shown in OG images. Derived from `site` in astro.config.mjs.
 * When you fork Dulak and change the domain, this updates automatically.
 */
const SITE_URL = process.env.SITE_URL ?? "https://dulak.pages.dev";
const BRAND_URL = new URL(SITE_URL).hostname.replace(/^www\./, "");
const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  bg: "#0a0a0a",
  accent: "#059669",
  accentBright: "#34d399",
  text: "#fafafa",
  textMuted: "#a1a1aa",
};

let logoCache: string | null = null;
async function loadLogo(): Promise<string> {
  if (logoCache) return logoCache;
  const logoPath = join(ROOT, "src", "assets", "logo.svg");
  const svg = await readFile(logoPath, "utf-8");
  logoCache = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return logoCache;
}

let fontCache: Buffer | null = null;
async function loadFont(): Promise<Buffer> {
  if (fontCache) return fontCache;
  const candidates = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  ];
  for (const p of candidates) {
    try {
      fontCache = await readFile(p);
      return fontCache;
    } catch {}
  }
  throw new Error(
    "No suitable font found for OG image generation. Install Arial or DejaVu Sans.",
  );
}

export async function getStaticPaths() {
  const docs = await getCollection("docs");
  return docs
    .filter((entry) => (entry.slug ?? entry.id) && (entry.slug ?? entry.id).length > 0)
    .map((entry) => ({
      params: { slug: entry.slug ?? entry.id },
      props: {
        title: entry.data.title,
        description: (entry.data.description ?? "") as string,
      },
    }));
}

export async function GET({
  props,
}: {
  props: { title: string; description: string };
}) {
  const { title, description } = props;
  const logo = await loadLogo();
  const font = await loadFont();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: COLORS.bg,
          backgroundImage: `radial-gradient(circle at 85% 15%, ${COLORS.accent}22 0%, transparent 50%)`,
          padding: "80px",
          fontFamily: "Arial",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "auto",
              },
              children: [
                {
                  type: "img",
                  props: { src: logo, width: 48, height: 48 },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 28,
                      fontWeight: 700,
                      color: COLORS.text,
                    },
                    children: "Dulak",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 56,
                      fontWeight: 700,
                      color: COLORS.text,
                      lineHeight: 1.2,
                      maxWidth: "900px",
                    },
                    children: title,
                  },
                },
                description
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 28,
                          color: COLORS.textMuted,
                          lineHeight: 1.4,
                          maxWidth: "850px",
                        },
                        children: description,
                      },
                    }
                  : null,
              ].filter(Boolean),
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "auto",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: 40,
                      height: 4,
                      backgroundColor: COLORS.accent,
                      borderRadius: 2,
                    },
                  },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 22,
                      color: COLORS.accentBright,
                      fontWeight: 600,
                    },
                    children: BRAND_URL,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: "Arial", data: font, weight: 700, style: "normal" }],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
