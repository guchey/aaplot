import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { detectTheme, resolvePalette, isNoColor } from "../../src/renderer/color.ts";

describe("detectTheme", () => {
  let origColorFgBg: string | undefined;

  beforeEach(() => {
    origColorFgBg = process.env["COLORFGBG"];
  });

  afterEach(() => {
    if (origColorFgBg === undefined) {
      delete process.env["COLORFGBG"];
    } else {
      process.env["COLORFGBG"] = origColorFgBg;
    }
  });

  test("returns dark by default when COLORFGBG is not set", () => {
    delete process.env["COLORFGBG"];
    expect(detectTheme()).toBe("dark");
  });

  test("returns light when background color index < 8", () => {
    process.env["COLORFGBG"] = "15;0";
    expect(detectTheme()).toBe("light");
  });

  test("returns dark when background color index >= 8", () => {
    process.env["COLORFGBG"] = "0;15";
    expect(detectTheme()).toBe("dark");
  });

  test("handles multi-part COLORFGBG (uses last part)", () => {
    process.env["COLORFGBG"] = "15;default;0";
    expect(detectTheme()).toBe("light");
  });
});

describe("resolvePalette", () => {
  test("returns dark palette for 'dark' theme", () => {
    const palette = resolvePalette("dark");
    expect(palette.bar).toBe("\x1b[36m"); // cyan
    expect(palette.reset).toBe("\x1b[0m");
  });

  test("returns light palette for 'light' theme", () => {
    const palette = resolvePalette("light");
    expect(palette.bar).toBe("\x1b[34m"); // blue
  });

  test("auto resolves based on detectTheme", () => {
    const palette = resolvePalette("auto");
    expect(palette.reset).toBe("\x1b[0m");
    // Just verify it returns a valid palette
    expect(palette.axis).toBeDefined();
    expect(palette.line).toBeDefined();
  });
});

describe("isNoColor", () => {
  let origNoColor: string | undefined;

  beforeEach(() => {
    origNoColor = process.env["NO_COLOR"];
  });

  afterEach(() => {
    if (origNoColor === undefined) {
      delete process.env["NO_COLOR"];
    } else {
      process.env["NO_COLOR"] = origNoColor;
    }
  });

  test("returns true when NO_COLOR is set", () => {
    process.env["NO_COLOR"] = "";
    expect(isNoColor()).toBe(true);
  });

  test("returns true when NO_COLOR is set to any value", () => {
    process.env["NO_COLOR"] = "1";
    expect(isNoColor()).toBe(true);
  });

  // Note: stderr.isTTY is false in test environment, so isNoColor() returns true
  // even without NO_COLOR. We test the NO_COLOR branch explicitly above.
});
