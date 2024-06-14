import { select } from "d3-selection";

type CanvaProps = {
  d3Selection: any;
  d3Zoom: any;
  canvasRef: React.RefObject<any>;
  zoomContainerRef: React.RefObject<any>;
};
export const getCanvasState = ({
  d3Selection,
  d3Zoom,
  canvasRef,
  zoomContainerRef,
}: CanvaProps) => {
  return {
    canvasNode: select(canvasRef.current),
    zoomNode: select(zoomContainerRef.current),
    currentPosition: d3Selection.current.property("__zoom"),
    d3Zoom,
  };
};
