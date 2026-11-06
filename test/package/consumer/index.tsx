import {
  Background,
  COMPONENT_POSITIONS,
  EventBlocker,
  ReactInfiniteCanvas,
  SCROLL_NODE_POSITIONS,
} from "react-infinite-canvas";
import type {
  BackgroundProps,
  CanvasState,
  EventBlockerProps,
  ReactInfiniteCanvasHandle,
  ReactInfiniteCanvasProps,
  ZoomState,
} from "react-infinite-canvas";

declare const s: CanvasState;
// @ts-expect-error d3Zoom is typed, not any
const n: number = s.d3Zoom;

declare const handle: ReactInfiniteCanvasHandle;
const onZoom = (z: ZoomState) => z.scale;
const props: ReactInfiniteCanvasProps = { children: <div />, onZoom };
const bg: BackgroundProps = {};
const blocker: EventBlockerProps = { children: null };

export const used = [
  n,
  handle,
  props,
  bg,
  blocker,
  COMPONENT_POSITIONS,
  SCROLL_NODE_POSITIONS,
];

export const App = () => (
  <ReactInfiniteCanvas>
    <EventBlocker>
      <Background />
    </EventBlocker>
  </ReactInfiniteCanvas>
);
