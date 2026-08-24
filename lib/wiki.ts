const USER_AGENT = "TravelGennie/1.0 (https://github.com/duttakaushikkd/Travel-Gennie)";

type WikiHit = {
  snippet: string;
  title: string;
  url: string;
};

type SearchResponse = {
  query?: {
    search?: Array<{ snippet?: string; title: string }>;
  };
};

type ExtractPage = {
  extract?: string;
  fullurl?: string;
  missing?: boolean;
  title?: string;
};

type ExtractResponse = {
  query?: {
    pages?: ExtractPage[] | Record<string, ExtractPage>;
  };
};

function stripWikiMarkup(html: string): string {
  return html
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#039;", "'")
    .replaceAll("&nbsp;", " ")
    .trim();
}

async function wikiFetch(url: URL): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) {
    throw new Error(`Wikipedia search failed (${response.status}).`);
  }
  return response;
}

async function searchHost(host: string, query: string, limit: number): Promise<WikiHit[]> {
  const searchUrl = new URL(`https://${host}/w/api.php`);
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("formatversion", "2");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set("srlimit", String(limit));
  searchUrl.searchParams.set("srsearch", query);

  const searchResponse = await wikiFetch(searchUrl);
  const searchJson = (await searchResponse.json()) as SearchResponse;
  const matches = searchJson.query?.search ?? [];
  if (matches.length === 0) {
    return [];
  }

  const titles = matches.map((match) => match.title);
  const extractUrl = new URL(`https://${host}/w/api.php`);
  extractUrl.searchParams.set("action", "query");
  extractUrl.searchParams.set("exintro", "1");
  extractUrl.searchParams.set("explaintext", "1");
  extractUrl.searchParams.set("format", "json");
  extractUrl.searchParams.set("formatversion", "2");
  extractUrl.searchParams.set("inprop", "url");
  extractUrl.searchParams.set("prop", "extracts|info");
  extractUrl.searchParams.set("redirects", "1");
  extractUrl.searchParams.set("titles", titles.join("|"));

  const extractResponse = await wikiFetch(extractUrl);
  const extractJson = (await extractResponse.json()) as ExtractResponse;
  const rawPages = extractJson.query?.pages;
  const pageList = Array.isArray(rawPages) ? rawPages : Object.values(rawPages ?? {});
  const byTitle = new Map<string, ExtractPage>();
  for (const page of pageList) {
    if (page.title) {
      byTitle.set(page.title, page);
    }
  }

  return matches.flatMap((match) => {
    const page = byTitle.get(match.title);
    if (page?.missing) {
      return [];
    }
    const snippet =
      page?.extract?.slice(0, 400) || stripWikiMarkup(match.snippet ?? "").slice(0, 400);
    const url = page?.fullurl ?? `https://${host}/wiki/${encodeURIComponent(match.title.replaceAll(" ", "_"))}`;
    return [{ snippet, title: match.title, url }];
  });
}

export async function searchTravelWeb(query: string, numResults = 6): Promise<WikiHit[]> {
  const perHost = Math.max(3, Math.ceil(numResults / 2) + 1);
  const [voyage, wikipedia] = await Promise.all([
    searchHost("en.wikivoyage.org", query, perHost),
    searchHost("en.wikipedia.org", query, perHost),
  ]);

  const seen = new Set<string>();
  const merged: WikiHit[] = [];
  for (const hit of [...voyage, ...wikipedia]) {
    const key = hit.title.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(hit);
    if (merged.length >= numResults) {
      break;
    }
  }
  return merged;
}
