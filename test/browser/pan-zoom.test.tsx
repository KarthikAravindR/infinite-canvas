import { expect, test } from "vitest";
import { server } from "vitest/browser";
import { contentPosition, drag, renderCanvas } from "./helpers";

test("WebKit takes the Safari (div) path; Chromium and Firefox take the svg path", async () => {
  const { host } = await renderCanvas();
  expect(host.querySelector("svg foreignObject") !== null).toBe(
    server.browser !== "webkit",
  );
});

test("drag on empty canvas pans content by the drag distance", async () => {
  const { node, empty } = await renderCanvas();
  const before = contentPosition(node);
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: -50,
    y: -30,
  });
});
