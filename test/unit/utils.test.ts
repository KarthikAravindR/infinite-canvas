import { expect, test } from "vitest";
import { clampValue, getBlockClassName } from "../../src/helpers/utils";

test("clampValue limits a value to the range", () => {
  expect(clampValue({ value: -5, min: 0, max: 10 })).toBe(0);
  expect(clampValue({ value: 5, min: 0, max: 10 })).toBe(5);
  expect(clampValue({ value: 15, min: 0, max: 10 })).toBe(10);
});

const S = "react-infinite-canvas-block-scroll";
const Z = "react-infinite-canvas-block-zoom";
const P = "react-infinite-canvas-block-pan";
test.each([
  [false, false, false, ""],
  [true, false, false, S],
  [false, true, false, Z],
  [false, false, true, P],
  [true, true, false, `${S} ${Z}`],
  [true, false, true, `${S} ${P}`],
  [false, true, true, `${Z} ${P}`],
  [true, true, true, "react-infinite-canvas-block-events"],
])("getBlockClassName(scroll=%s, zoom=%s, pan=%s)", (s, z, p, expected) => {
  expect(getBlockClassName(s, z, p)).toBe(expected);
});
