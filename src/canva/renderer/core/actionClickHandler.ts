import { select } from "d3-selection";
import { ZOOM_CONFIGS, ZOOM_CONTROLS } from "../../../helpers/constants";

type ClickHandlerProps = {
  canvasRef: React.RefObject<any>;
  d3Selection: any;
  fitContentToView: any;
  d3Zoom: any;
};

export function actionClickHandler(
  actionId: string,
  { canvasRef, d3Selection, fitContentToView, d3Zoom }: ClickHandlerProps
) {
  const canvasNode = select(canvasRef.current);
  const { k: currentScale } = d3Selection.current.property("__zoom");
  switch (actionId) {
    case ZOOM_CONTROLS.FIT_TO_VIEW:
      fitContentToView({});
      break;

    case ZOOM_CONTROLS.FIT_TO_HUNDRED:
      d3Zoom.scaleTo(
        // @ts-ignore
        canvasNode.transition().duration(ZOOM_CONFIGS.TIME_FRAME),
        1
      );
      break;

    case ZOOM_CONTROLS.ZOOM_IN:
      d3Zoom.scaleTo(
        // @ts-ignore
        canvasNode.transition().duration(ZOOM_CONFIGS.TIME_FRAME),
        currentScale + ZOOM_CONFIGS.ZOOM_RATIO
      );
      break;

    case ZOOM_CONTROLS.ZOOM_OUT:
      d3Zoom.scaleTo(
        // @ts-ignore
        canvasNode.transition().duration(ZOOM_CONFIGS.TIME_FRAME),
        currentScale - ZOOM_CONFIGS.ZOOM_RATIO
      );
      break;

    default:
      break;
  }
}
