import { zoomIdentity } from "d3-zoom";
import { TIME_TO_WAIT } from "../../../constants";
import { ZOOM_CONFIGS } from "../../../../helpers/constants";
import { clampValue } from "../../../../helpers/utils";
import { select } from "d3-selection";

export type FitContentHanlderProps = {
  duration?: number;
  offset?: { x: number; y: number };
  scale?: number;
  maxZoomLimit?: number;
  flowRendererRef: any;
  canvasRef: any;
  d3Selection: any;
  setZoomTransform: any;
  scrollBarRef: any;
  d3Zoom: any;
  minZoom: any;
  maxZoom: any;
};

export function fitContentToViewHandler(props: FitContentHanlderProps) {
  const {
    duration = 500,
    offset = { x: 0, y: 0 },
    maxZoomLimit = ZOOM_CONFIGS.FIT_TO_VIEW_MAX_ZOOM,
    scale = 1,
    flowRendererRef,
    canvasRef,
    d3Selection,
    setZoomTransform,
    scrollBarRef,
    d3Zoom,
    minZoom,
    maxZoom,
  } = props;
  console.log({ props });
  requestIdleCallback(
    () => {
      if (!flowRendererRef.current) return;
      const canvasNode = select(canvasRef.current);
      const contentBounds = flowRendererRef.current.getBoundingClientRect();
      const currentZoom = d3Selection.current.property("__zoom").k || 1;
      const containerBounds = canvasRef.current?.getBoundingClientRect();
      const { width: containerWidth = 0, height: containerHeight = 0 } =
        containerBounds || {};
      const scaleDiff = 1 / currentZoom;
      const contentWidth = contentBounds.width * scaleDiff;
      const contentHeight = contentBounds.height * scaleDiff;
      const heightRatio = containerHeight / contentHeight;
      const newScale =
        scale ??
        clampValue({
          value: Math.min(maxZoomLimit, heightRatio),
          min: minZoom,
          max: maxZoom,
        });

      // below code calculates the translateX and translateY values to
      // center the content horizontally and fit content vertically
      const translateX =
        (containerWidth - contentWidth * newScale) / 2 + offset.x;
      const translateY = offset.y;

      const newTransform = zoomIdentity
        .translate(translateX, translateY)
        .scale(newScale);
      setZoomTransform({ translateX, translateY, scale: newScale });
      scrollBarRef.current?.resetScrollPos();

      canvasNode
        // @ts-ignore
        .transition()
        .duration(duration)
        .call(d3Zoom.transform, newTransform);
    },
    { timeout: TIME_TO_WAIT }
  );
}
