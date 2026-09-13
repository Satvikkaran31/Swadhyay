import { useEffect } from "react";

const SITE = "https://swadhyay.co";
const DEFAULT_IMAGE = `${SITE}/og-cover.webp`;

export interface PageSEO {
  title: string;
  description: string;
  /** Absolute path beginning with "/" — used for canonical + og:url. */
  path: string;
  /** Absolute image URL for social cards. Falls back to the site OG cover. */
  image?: string | null;
  /** og:type — "website" (default), "article", etc. */
  type?: string;
}

/**
 * Sets per-page SEO tags for a client-rendered route: <title>, description,
 * canonical link, Open Graph and Twitter card tags. Used by the dynamic detail
 * pages (course / article / series) whose metadata is only known after the API
 * responds. Passing an empty `title` is a no-op, so it is safe to call while the
 * page is still loading.
 *
 * Note: this runs in the browser after mount. Googlebot renders JS and picks it
 * up, but non-JS social scrapers only see the static index.html defaults — full
 * per-URL social previews would require SSR/prerendering.
 */
export function usePageSEO({ title, description, path, image, type = "website" }: PageSEO) {
  useEffect(() => {
    if (!title) return;

    const previousTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const url = `${SITE}${path}`;
    const img = image || DEFAULT_IMAGE;

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", url, true);
    setMeta("og:type", type, true);
    setMeta("og:image", img, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", img);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Restore the default title on unmount so a stale course/article title never
    // lingers on the next route before its own effect runs.
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, path, image, type]);
}

export default usePageSEO;
