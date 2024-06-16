import { drag, Selection } from "d3-drag";
import { pointer } from "d3-selection";
import { RefObject } from "react";
import styles from "../../../App.module.css";
import { ZOOM_CONFIGS } from "../../../helpers/constants";

type DragProps = {
  childComponentRef: RefObject<HTMLElement>;
  childComponentSelection: Selection<any, unknown, null, undefined>;
  canvasWrapperRef: RefObject<HTMLDivElement>;
  zoomTransform: any;
};

export const defineDragBehavior = (props: DragProps) => {
  const {
    childComponentRef,
    childComponentSelection,
    canvasWrapperRef,
    zoomTransform,
  } = props;

  let isDragging = false;
  let initialMouseX = 0;
  let initialMouseY = 0;
  let zoomMultiplier = 1;
  let translateDeltaX = 0;
  let translateDeltaY = 0;
  let childComponentWidth = 1;
  let childComponentHeight = 1;
  let childComponentBounds: DOMRect | null = null;
  const setDrag = drag(childComponentRef.current)
    .on("start", (e: any) => {
      isDragging = true;
      childComponentBounds =
        childComponentRef.current?.getBoundingClientRect() || null;
      const [x, y] = pointer(e);
      initialMouseX = x;
      initialMouseY = y;
      zoomMultiplier = 1 / zoomTransform.scale;
      translateDeltaX = (zoomTransform.translateX * 1) / zoomTransform.scale;
      translateDeltaY = (zoomTransform.translateY * 1) / zoomTransform.scale;
      childComponentWidth = childComponentRef.current?.offsetWidth || 1;
      childComponentHeight = childComponentRef.current?.offsetHeight || 1;
      console.log(childComponentRef.current.style.transform);
    })
    .on("drag", (event: any) => {
      const [x, y] = pointer(event);
      const offsetX = x - initialMouseX;
      const offsetY = y - initialMouseY;

      if (childComponentRef.current && isDragging) {
        let translateX = offsetX * zoomMultiplier - translateDeltaX;
        let translateY = offsetY * zoomMultiplier - translateDeltaY;

        console.log({ offsetY, y, initialMouseY });
        if (translateX < 0) {
          translateX = 0;
        }
        if (translateY < 0) {
          translateY = 0;
        }

        if (translateX >= ZOOM_CONFIGS.DEFAULT_LAYOUT - childComponentWidth) {
          translateX = ZOOM_CONFIGS.DEFAULT_LAYOUT - childComponentWidth;
        }

        if (translateY >= ZOOM_CONFIGS.DEFAULT_LAYOUT - childComponentHeight) {
          translateY = ZOOM_CONFIGS.DEFAULT_LAYOUT - childComponentHeight;
        }

        childComponentRef.current.style.transform = `translate(${translateX}px, ${translateY}px)`;
      }
    })
    .on("end", () => {
      isDragging = false;

      // Actions on drag end
    });

  // Continue with setting up behaviors
  childComponentSelection.on("mouseover", (e: any) => {
    canvasWrapperRef?.current?.classList.add(styles.panning);
  });
  childComponentSelection
    .on("mouseout", () => {
      canvasWrapperRef?.current?.classList.remove(styles.panning);
    })
    .call(setDrag);
};
