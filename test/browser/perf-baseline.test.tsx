import { Profiler } from "react";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ReactInfiniteCanvas } from "../../src/main";
import { drag, settle } from "./helpers";

// v4 target: canvas 0, custom component 0 unless it reads the transform.
test("baseline: 30 pan moves render the canvas 30 times, a custom component 30 times and children 0 times", async () => {
  const counts = { canvas: 0, custom: 0, child: 0 };
  const Custom = (_: { zoomState?: unknown }) => {
    counts.custom++;
    return <div />;
  };
  const Child = () => {
    counts.child++;
    return <div style={{ width: 400, height: 300 }} />;
  };
  await render(
    <div data-testid="host" style={{ width: 600, height: 400 }}>
      <Profiler
        id="canvas"
        onRender={() => {
          counts.canvas++;
        }}
      >
        <ReactInfiniteCanvas customComponents={[{ component: <Custom /> }]}>
          <Child />
        </ReactInfiniteCanvas>
      </Profiler>
    </div>,
  );
  await settle();
  counts.canvas = counts.custom = counts.child = 0;
  const host = document.querySelector('[data-testid="host"]') as HTMLElement;
  const r = host.getBoundingClientRect();
  const from = { x: r.left + 500, y: r.top + 330 };
  await drag(from, { x: from.x - 30, y: from.y }, 30);
  expect(counts).toEqual({ canvas: 30, custom: 30, child: 0 });
});
