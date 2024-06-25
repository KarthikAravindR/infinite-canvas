import { Selection, select } from "d3-selection";
import { isSafari } from "../../constants";
import {
  scrollNodeHandler,
  scrollNodeToCenterHandler,
} from "./exposed/scrollNodeHandler";
import { onMouseDown } from "./onMouseDown";
import { ZoomBehavior } from "d3-zoom";
import { ReactInfiniteCanvasHandle } from "../../types";

export type ZoomAndPanProps = {
  d3Zoom: ZoomBehavior<SVGAElement, unknown>;
  isUserPressed: React.MutableRefObject<boolean | null>;
  canvasWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
  styles: CSSModuleClasses;
  zoomContainerRef: React.MutableRefObject<any>;
  setZoomTransform: React.Dispatch<React.SetStateAction<any>>;
  onCanvasMount: (functions: ReactInfiniteCanvasHandle) => void;
  scrollContentHorizontallyCenter: any;
  fitContentToView: any;
  getCanvasState: () => {
    canvasNode: Selection<any, unknown, null, undefined>;
    zoomNode: Selection<any, unknown, null, undefined>;
    currentPosition: any;
    d3Zoom: ZoomBehavior<SVGAElement, unknown>;
  };
};

export const zoomAndPanHandler = ({
  d3Zoom,
  isUserPressed,
  canvasWrapperRef,
  styles,
  zoomContainerRef,
  setZoomTransform,
  onCanvasMount,
  scrollContentHorizontallyCenter,
  fitContentToView,
  getCanvasState,
}: ZoomAndPanProps) => {
  const zoomNode = select(zoomContainerRef.current);

  d3Zoom
    .filter((event: { type: string; ctrlKey: any }) => {
      if (event.type === "mousedown" && !isUserPressed.current) {
        isUserPressed.current = true;
        onMouseDown();
      }

      return event.ctrlKey || event.type !== "wheel";
    })
    .on(
      "zoom",
      (event: {
        sourceEvent: { ctrlKey: boolean };
        type: string;
        transform: any;
      }) => {
        if (event.sourceEvent?.ctrlKey === false && event.type === "zoom") {
          canvasWrapperRef.current?.classList.add(styles.grabbing);
          canvasWrapperRef.current?.classList.add(styles.panning);
        }
        const zoomTransform = event.transform;
        const { x: translateX, y: translateY, k: scale } = zoomTransform;
        const div = zoomContainerRef.current;
        setZoomTransform({ translateX, translateY, scale });
        if (isSafari && div) {
          div.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        } else {
          zoomNode.attr("transform", zoomTransform);
        }
      }
    );

  d3Zoom.on("end", () => {
    isUserPressed.current = false;
    canvasWrapperRef.current?.classList.remove(styles.panning);
    canvasWrapperRef.current?.classList.remove(styles.grabbing);
  });

  onCanvasMount({
    scrollNodeToCenter: scrollNodeToCenterHandler,
    scrollNodeHandler,
    scrollContentHorizontallyCenter,
    fitContentToView,
    getCanvasState,
  });
};
