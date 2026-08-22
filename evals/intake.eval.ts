import { defineEval } from "eve/evals";

export default defineEval({
  description: "Incomplete trip briefs should collect intake fields before fare search.",
  async test(t) {
    await t.send("I want to go to Goa.");
    t.succeeded();
    t.notCalledTool("search_and_rank_fares");
  },
});
