import { expectTypeOf } from "vitest";
import type {
  CanvasState,
  ReactInfiniteCanvasHandle,
  ReactInfiniteCanvasProps,
  ZoomState,
} from "../../src/main";

type Params<K extends keyof ReactInfiniteCanvasHandle> = Parameters<
  ReactInfiniteCanvasHandle[K]
>[0];

expectTypeOf<CanvasState["d3Zoom"]>().not.toBeAny();
expectTypeOf<ReactInfiniteCanvasProps["onZoom"]>().toEqualTypeOf<
  ((zoomState: ZoomState) => void) | undefined
>();

expectTypeOf<Params<"scrollNodeToCenter">>().toEqualTypeOf<{
  nodeElement?: HTMLElement;
  offset?: { x: number; y: number };
  scale?: number;
  shouldUpdateMaxScale?: boolean;
  maxScale?: number;
  transitionDuration?: number;
}>();
expectTypeOf<Params<"scrollNodeHandler">>().toEqualTypeOf<{
  nodeElement?: HTMLElement;
  offset?: { x: number; y: number };
  scale?: number;
  shouldUpdateMaxScale?: boolean;
  maxScale?: number;
  transitionDuration?: number;
  position?: string;
}>();
expectTypeOf<Params<"scrollContentHorizontallyCenter">>().toEqualTypeOf<{
  offset?: number;
  transitionDuration?: number;
}>();
expectTypeOf<Params<"fitContentToView">>().toEqualTypeOf<{
  duration?: number;
  offset?: { x: number; y: number };
  scale?: number;
  maxZoomLimit?: number;
}>();
expectTypeOf<ReactInfiniteCanvasHandle["getCanvasState"]>().toEqualTypeOf<
  () => CanvasState
>();
