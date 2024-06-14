import { select } from "d3-selection";
import { TIME_TO_WAIT } from "../../constants";
import { zoomIdentity } from "d3-zoom";

type SrollCenterProps = {
  offset?: number;
  transitionDuration?: number;
  flowRendererRef?: any;
  d3Selection?: any;
  canvasRef?: any;
  setZoomTransform?: any;
  zoomTransform?: any;
  zoomIdentity?: any;
  d3Zoom?: any;
};

export const scrollContentHorizontallyCenter = (props: SrollCenterProps) => {
  const {
    offset = 0,
    transitionDuration = 300,
    flowRendererRef,
    d3Selection,
    canvasRef,
    setZoomTransform,
    zoomTransform,
    d3Zoom,
  } = props;
  if (!flowRendererRef.current) return;
  requestIdleCallback(
    () => {
      const zoomLevel = d3Selection.current.property("__zoom");
      const { k: scale, y: translateY } = zoomLevel;
      const canvasNode = select(canvasRef.current);

      // calculating svgBounds again because its width might be different if rightPanel is opened
      const svgBounds = canvasRef.current.getBoundingClientRect();
      const nodeBounds = flowRendererRef.current.getBoundingClientRect();
      const scaleDiff = 1 / scale;
      const nodeBoundsWidth = nodeBounds.width * scaleDiff;

      const updatedX = (svgBounds.width - nodeBoundsWidth * scale) / 2 + offset;

      setZoomTransform({
        ...zoomTransform,
        translateX: updatedX,
      });

      const newTransform = zoomIdentity
        .translate(updatedX, translateY)
        .scale(scale);

      canvasNode
        // @ts-ignore
        .transition()
        .duration(transitionDuration)
        .call(d3Zoom.transform, newTransform);
    },
    { timeout: TIME_TO_WAIT }
  );
};
