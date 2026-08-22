import Exa from "exa-js";

export async function searchTravelWeb(query: string, numResults = 6) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set.");
  }

  const exa = new Exa(apiKey);
  const { results } = await exa.searchAndContents(query, {
    type: "auto",
    numResults,
    text: { maxCharacters: 1200 },
  });

  return results.map((result) => ({
    title: result.title,
    url: result.url,
    snippet: result.text?.slice(0, 400) ?? "",
  }));
}
