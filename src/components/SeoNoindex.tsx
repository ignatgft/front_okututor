import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isPrivatePath } from "../utils/analytics";

const SITE_URL = "https://okututor.com";

function setMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Runtime SEO guard:
 *  - private/admin routes get <meta name="robots" content="noindex, nofollow">
 *    so authenticated app content never appears in Google results;
 *  - public routes get index,follow and a canonical URL;
 *  - document.title is synced from the page-title context via document.title
 *    (set by pages) — here we only manage robots/canonical.
 */
export default function SeoNoindex(): null {
  const location = useLocation();
  const isPrivate = isPrivatePath(location.pathname);

  useEffect(() => {
    setMeta("name", "robots", isPrivate ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large");

    if (isPrivate) {
      // remove canonical on private pages so Google never sees a canonical pointing at private content
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
    } else {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = SITE_URL + location.pathname;
    }
  }, [location.pathname, isPrivate]);

  return null;
}
