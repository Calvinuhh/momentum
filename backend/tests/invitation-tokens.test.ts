import { describe, expect, test } from "bun:test";
import { claimInvitationSchema } from "../src/modules/invitations/claim/schema.js";
import { createInvitationSchema } from "../src/modules/invitations/create/schema.js";
import { createInvitationToken, hashInvitationToken } from "../src/utils/invitation-tokens.js";

describe("workspace invitations", () => {
  test("creates high-entropy URL-safe tokens and hashes them deterministically", async () => {
    const token = createInvitationToken();
    const hash = await hashInvitationToken(token);

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toHaveLength(64);
    expect(hash).toBe(await hashInvitationToken(token));
    expect(hash).not.toContain(token);
  });

  test("normalizes invitation emails and restricts assignable roles", () => {
    expect(createInvitationSchema.parse({ email: "  User@Example.com ", role: "MEMBER" })).toEqual({
      email: "user@example.com",
      role: "MEMBER",
    });
    expect(createInvitationSchema.safeParse({ email: "user@example.com", role: "OWNER" }).success).toBe(false);
  });

  test("requires the normal password policy when claiming", () => {
    const token = createInvitationToken();
    expect(claimInvitationSchema.safeParse({ token, password: "weak" }).success).toBe(false);
    expect(claimInvitationSchema.safeParse({ token, password: "StrongPass!" }).success).toBe(true);
  });
});
