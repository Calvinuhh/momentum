import { describe, expect, test } from "bun:test";
import { createInvitationSchema } from "../src/modules/invitations/create/schema.js";
import { previewInvitationSchema } from "../src/modules/invitations/preview/schema.js";
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

  test("accepts only one valid invitation reference", () => {
    const token = createInvitationToken();
    expect(previewInvitationSchema.safeParse({ token }).success).toBe(true);
    expect(previewInvitationSchema.safeParse({ invitationId: "a".repeat(24) }).success).toBe(true);
    expect(previewInvitationSchema.safeParse({ token, invitationId: "a".repeat(24) }).success).toBe(false);
    expect(previewInvitationSchema.safeParse({ invitationId: "../invitation" }).success).toBe(false);
  });
});
