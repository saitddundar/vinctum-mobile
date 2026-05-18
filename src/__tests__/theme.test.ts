import { colors, spacing, radius } from "../lib/theme";

describe("theme", () => {
  it("exports expected color tokens", () => {
    expect(colors.bg).toBeDefined();
    expect(colors.accent).toBe("#7c5bf5");
    expect(colors.text).toBeDefined();
    expect(colors.error).toBeDefined();
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
  });

  it("exports spacing scale", () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
    expect(spacing.lg).toBeLessThan(spacing.xl);
  });

  it("exports radius values", () => {
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.pill).toBe(999);
  });
});
