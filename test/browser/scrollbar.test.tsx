import { expect, test } from "vitest";
import { drag, renderCanvas } from "./helpers";

// The pan matters: before the first pan no scrollbar renders anyway (B16).
test("no scrollbar without renderScrollBar", async () => {
  const { host, empty } = await renderCanvas();
  await drag(empty, { x: empty.x + 1, y: empty.y });
  expect(host.querySelector('[data-id="horizontal-scrollbar"]')).toBeNull();
});
