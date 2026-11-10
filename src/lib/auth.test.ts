import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS, authenticate } from "@/lib/auth";
import { canAccess, homeFor } from "@/lib/permissions";

describe("demo authentication", () => {
  it("maps each fixed credential to one role", () => {
    for (const account of DEMO_ACCOUNTS) {
      const result = authenticate(account.email, account.password);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.session.role).toBe(account.role);
        expect(result.session.userId).toBe(account.userId);
      }
    }
  });

  it("rejects a wrong password and a malformed email", () => {
    expect(authenticate("customer@demo.com", "nope").ok).toBe(false);
    expect(authenticate("not-an-email", "Demo123!").ok).toBe(false);
    expect(authenticate("artist@demo.com", "").ok).toBe(false);
  });

  it("keeps dashboard homes separate", () => {
    expect(homeFor("customer")).toBe("/customer");
    expect(homeFor("artist")).toBe("/artist");
    expect(homeFor("admin")).toBe("/admin");
    expect(canAccess("customer", "artist")).toBe(false);
    expect(canAccess("admin", "admin")).toBe(true);
  });
});
