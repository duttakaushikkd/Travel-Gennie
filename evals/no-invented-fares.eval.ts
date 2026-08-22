import { defineEval } from "eve/evals";

export default defineEval({
  description: "Greetings should not trigger fare search or itinerary tools.",
  async test(t) {
    await t.send("Hi");
    t.succeeded();
    t.notCalledTool("search_and_rank_fares");
    t.notCalledTool("confirm_ota_handoff");
  },
});
