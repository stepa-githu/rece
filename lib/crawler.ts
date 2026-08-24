const blockedHosts = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i;

function validateUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Il sito deve usare http o https.");
  if (blockedHosts.test(url.hostname) || url.hostname.endsWith(".local")) throw new Error("Indirizzo del sito non consentito.");
  url.hash = ""; return url;
}

function decodeEntities(value: string) {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

export function htmlToText(html: string) {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function pageTitle(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return match ? htmlToText(match[1]).slice(0, 160) : fallback;
}

function linksFrom(html: string, pageUrl: URL, origin: string) {
  const urls = new Set<string>(); const regex = /href\s*=\s*["']([^"'#]+)["']/gi; let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) { try { const url = new URL(match[1], pageUrl); url.hash = ""; if (url.origin === origin && !/\.(pdf|jpe?g|png|gif|webp|zip|xml)$/i.test(url.pathname)) urls.add(url.toString()); } catch {} }
  return [...urls];
}

async function safeHtmlFetch(input: URL) {
  let current = input;
  for (let redirect = 0; redirect < 4; redirect += 1) {
    const response = await fetch(current, { redirect: "manual", headers: { "User-Agent": "Rece Hospitality Knowledge Bot/1.0", Accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(12_000) });
    if (response.status >= 300 && response.status < 400) { const location = response.headers.get("location"); if (!location) throw new Error("Reindirizzamento del sito non valido."); current = validateUrl(new URL(location, current).toString()); continue; }
    if (!response.ok) throw new Error(`Il sito ha risposto con errore ${response.status}.`);
    const type = response.headers.get("content-type") || ""; if (!type.includes("text/html")) throw new Error("La pagina non contiene HTML leggibile.");
    const length = Number(response.headers.get("content-length") || 0); if (length > 1_000_000) throw new Error("La pagina è troppo grande.");
    return { html: (await response.text()).slice(0, 1_000_000), url: current };
  }
  throw new Error("Troppi reindirizzamenti.");
}

export async function crawlWebsite(value: string, maxPages = 8) {
  const start = validateUrl(value); const origin = start.origin; const queue = [start.toString()]; const visited = new Set<string>(); const pages: Array<{ url: string; title: string; text: string }> = [];
  while (queue.length && pages.length < maxPages) {
    const next = queue.shift()!; if (visited.has(next)) continue; visited.add(next);
    try { const result = await safeHtmlFetch(validateUrl(next)); if (result.url.origin !== origin) continue; const text = htmlToText(result.html).slice(0, 60_000); if (text.length > 120) pages.push({ url: result.url.toString(), title: pageTitle(result.html, result.url.pathname), text }); for (const link of linksFrom(result.html, result.url, origin)) if (!visited.has(link) && queue.length < 40) queue.push(link); }
    catch (cause) { if (!pages.length && !queue.length) throw cause; }
  }
  if (!pages.length) throw new Error("Non sono riuscito a leggere contenuti utili dal sito.");
  return { pages, text: pages.map((page) => `PAGINA: ${page.title}\nURL: ${page.url}\n${page.text}`).join("\n\n---\n\n") };
}
