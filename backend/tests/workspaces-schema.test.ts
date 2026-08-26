import { describe, expect, test } from "bun:test";
import { createWorkspaceSchema } from "../src/modules/workspaces/workspace/schema.js";

const baseWorkspace = { name: "Momentum" };

describe("createWorkspaceSchema description", () => {
  test("allows an omitted or null description", () => {
    expect(createWorkspaceSchema.parse(baseWorkspace).description).toBeNull();
    expect(createWorkspaceSchema.parse({ ...baseWorkspace, description: null }).description).toBeNull();
  });

  test("rejects an empty or whitespace-only description", () => {
    expect(createWorkspaceSchema.safeParse({ ...baseWorkspace, description: "" }).success).toBe(false);
    expect(createWorkspaceSchema.safeParse({ ...baseWorkspace, description: "   " }).success).toBe(false);
  });

  test("rejects descriptions shorter than five characters", () => {
    expect(createWorkspaceSchema.safeParse({ ...baseWorkspace, description: "abcd" }).success).toBe(false);
  });

  test("trims and accepts descriptions with at least five characters", () => {
    expect(createWorkspaceSchema.parse({ ...baseWorkspace, description: "  team goals  " }).description).toBe("team goals");
  });
});
