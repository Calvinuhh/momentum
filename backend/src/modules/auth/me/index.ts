import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/users.js";
import { requireAuth } from "../../../middleware/auth.js";

const meRouter = new Hono<{ Variables: { userId: string } }>();

meRouter.get("/", requireAuth, (c) => {
  const userId = c.get("userId");
  const user = db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } }, 401);
  }

  return c.json({ user });
});

export default meRouter;
