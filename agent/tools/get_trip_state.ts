import { defineTool } from "eve/tools";
import { z } from "zod";
import { tripSession } from "../lib/session-store";

export default defineTool({
  description: "Return the current trip brief captured in this session.",
  inputSchema: z.object({}),
  async execute() {
    const state = tripSession.get();
    return state.trip;
  },
});
