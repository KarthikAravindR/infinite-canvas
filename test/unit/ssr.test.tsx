import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";

// B8: importing the library reads navigator.userAgent at module load.
test("imports and server-renders without navigator", async () => {
  vi.stubGlobal("navigator", undefined);
  const { ReactInfiniteCanvas } = await import("../../src/main");
  expect(
    renderToString(
      <ReactInfiniteCanvas>
        <div />
      </ReactInfiniteCanvas>,
    ),
  ).toContain("<svg");
});
