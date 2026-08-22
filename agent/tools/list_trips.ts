import { defineTool } from "eve/tools";
import { z } from "zod";
import { listTripsForUser } from "../../lib/trips";
import { requireUserId } from "../lib/auth";

export default defineTool({
  description: "List saved trips for the signed-in user.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const userId = requireUserId(ctx);
    const rows = await listTripsForUser(userId);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updatedAt: row.updatedAt,
    }));
  },
});
