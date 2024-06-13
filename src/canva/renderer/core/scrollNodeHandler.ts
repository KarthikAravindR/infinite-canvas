import { zoomIdentity } from "d3-zoom";
import { SCROLL_NODE_POSITIONS } from "../../../main";
import { select } from "d3-selection";
import { getUpdatedNodePosition } from "../../../helpers/utils";
import { TIME_TO_WAIT } from "../../constants";

export type ScrollToCenterProps = {
  d3Zoom?: any;
  canvasRef?: any;
  d3Selection?: any;
  nodeElement?: HTMLElement;
  offset?: { x: number; y: number };
  scale?: number;
  shouldUpdateMaxScale?: boolean;
  maxScale?: number;
  transitionDuration?: number;
  position?: string;
};

export const scrollNodeHandler = ({
  d3Zoom,
  canvasRef,
  d3Selection,
  nodeElement,
  offset = { x: 0, y: 0 },
  scale,
  shouldUpdateMaxScale = true,
  maxScale,
  transitionDuration = 300,
  position = SCROLL_NODE_POSITIONS.TOP_CENTER,
}: ScrollToCenterProps) => {
  requestIdleCallback(
    () => {
      if (!nodeElement) return;
      const zoomLevel = d3Selection.current.property("__zoom");
      const {
        k: currentScale,
        x: currentTranslateX,
        y: currentTranslateY,
      } = zoomLevel;
      const canvasNode = select(canvasRef.current);

      const getUpdatedScale = () => {
        const getClampedScale = (scale: number) => {
          if (!maxScale) return scale;
          return Math.min(maxScale, scale);
        };

        if (!scale) return getClampedScale(currentScale);
        let updatedScale = scale;
        if (shouldUpdateMaxScale) {
          updatedScale = Math.max(scale, currentScale);
        }
        return getClampedScale(updatedScale);
      };

      const updatedScale = getUpdatedScale();

      // calculating svgBounds again because its width might be different if rightPanel is opened
      const svgBounds = canvasRef.current.getBoundingClientRect();
      const nodeBounds = nodeElement.getBoundingClientRect();
      const { updatedX, updatedY } = getUpdatedNodePosition({
        position,
        svgBounds,
        nodeBounds,
        currentTranslateX,
        currentTranslateY,
        currentScale,
        updatedScale,
        customOffset: { x: offset.x, y: offset.y },
      });

      const newTransform = zoomIdentity
        .translate(updatedX, updatedY)
        .scale(updatedScale);

      canvasNode
        // @ts-ignore
        .transition()
        .duration(transitionDuration)
        .call(d3Zoom.transform, newTransform);
    },
    { timeout: TIME_TO_WAIT }
  );
};
