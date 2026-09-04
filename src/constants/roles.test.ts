import { describe, it, expect } from "vitest";
import { ROLES, isStudent, isTutor, isAdmin, hasPermission, getPermissions } from "./roles";

describe("roles", () => {
  it("identifies roles", () => {
    expect(isStudent(ROLES.STUDENT)).toBe(true);
    expect(isTutor(ROLES.TUTOR)).toBe(true);
    expect(isAdmin(ROLES.ADMIN)).toBe(true);
    expect(isAdmin(ROLES.SUPER_ADMIN)).toBe(true);
    expect(isAdmin(ROLES.STUDENT)).toBe(false);
  });
  it("permissions", () => {
    expect(getPermissions(ROLES.STUDENT)).toContain("courses.view");
    expect(hasPermission(ROLES.TUTOR, "courses.create")).toBe(true);
    expect(hasPermission(ROLES.STUDENT, "courses.create")).toBe(false);
    expect(hasPermission(ROLES.ADMIN, "users.manage")).toBe(true);
  });
});
