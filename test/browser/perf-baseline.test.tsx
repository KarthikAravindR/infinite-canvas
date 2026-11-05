import { Profiler } from "react";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ReactInfiniteCanvas } from "../../src/main";
import { fire, nextFrame, settle } from "./helpers";

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
  // One move at a time, each waited out until its render commits. React 18
  // schedules the update from a native mousemove as a task, so a fixed one-frame
  // wait can let two moves share one render (29 instead of 30, seen on CI).
  fire("mousedown", from);
  for (let i = 1; i <= 30; i++) {
    const before = counts.canvas;
    fire("mousemove", { x: from.x - i, y: from.y }, { movementX: -1 });
    while (counts.canvas === before) await nextFrame();
  }
  fire("mouseup", { x: from.x - 30, y: from.y });
  await settle();
  expect(counts).toEqual({ canvas: 30, custom: 30, child: 0 });
});
