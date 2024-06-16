import { drag, Selection } from "d3-drag";
import { pointer } from "d3-selection";
import { RefObject } from "react";
import styles from "../../../App.module.css";

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
  const setDrag = drag()
    .on("start", (e) => {
      isDragging = true;
      const [x, y] = pointer(e);
      initialMouseX = x;
      initialMouseY = y;
      zoomMultiplier = 1 / zoomTransform.scale;
      translateDeltaX = (zoomTransform.translateX * 1) / zoomTransform.scale;
      translateDeltaY = (zoomTransform.translateY * 1) / zoomTransform.scale;
    })
    .on("drag", (event) => {
      const [x, y] = pointer(event);
      const offsetX = x - initialMouseX;
      const offsetY = y - initialMouseY;
      if (childComponentRef.current && isDragging) {
        const translateX = offsetX * zoomMultiplier - translateDeltaX;
        const translateY = offsetY * zoomMultiplier - translateDeltaY;

        childComponentRef.current.style.transform = `translate(${translateX}px, ${translateY}px)`;
      }
    })
    .on("end", () => {
      isDragging = false;

      // Actions on drag end
    });

  // Continue with setting up behaviors
  childComponentSelection.on("mouseover", (e) => {
    canvasWrapperRef?.current?.classList.add(styles.panning);
  });
  childComponentSelection
    .on("mouseout", () => {
      canvasWrapperRef?.current?.classList.remove(styles.panning);
    })
    .call(setDrag);
};

// export const defineDragBehavior = (
//   childComponentRef: RefObject<HTMLElement>,
//   d3Selection: Selection<any, unknown, null, undefined>
// ) => {
//   let isDragging = false;

//   const dragBehavior = drag()
//     .on("start", (e) => {
//       isDragging = true;
//       // Actions on drag start
//     })
//     .on("drag", (event) => {
//       const [x, y] = pointer(event);
//       if (childComponentRef.current && isDragging) {
//         childComponentRef.current.style.transform = `translate(${x}px, ${y}px)`;
//       }
//     })
//     .on("end", () => {
//       isDragging = false;
//       // Actions on drag end
//     });

//   // // Select the childComponentRef element within the d3Selection
//   // const childComponentSelection = d3Selection.select(
//   //   `.${childComponentRef.current?.className}`
//   // );
// };
