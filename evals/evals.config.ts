import { defineEvalConfig } from "eve/evals";

export default defineEvalConfig({
  judge: { model: "openai/gpt-4.1-mini" },
});
