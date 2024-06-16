import { drag, Selection } from "d3-drag";
import { pointer } from "d3-selection";
import { RefObject } from "react";
import styles from "../../../App.module.css";

type DragProps = {
  childComponentRef: RefObject<HTMLElement>;
  childComponentSelection: Selection<any, unknown, null, undefined>;
};

export const defineDragBehavior = (props: DragProps) => {
  const { childComponentRef, childComponentSelection, canvasWrapperRef } =
    props;

  let isDragging = false;

  const setDrag = drag()
    .on("start", (e) => {
      isDragging = true;
      // Actions on drag start
    })
    .on("drag", (event) => {
      const [x, y] = pointer(event);
      console.log(x, y);
      if (childComponentRef.current && isDragging) {
        childComponentRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    })
    .on("end", () => {
      isDragging = false;
      // Actions on drag end
    });

  // Continue with setting up behaviors
  childComponentSelection.on("mouseover", (e) => {
    canvasWrapperRef.current?.classList.add(styles.panning);
  });
  childComponentSelection
    .on("mouseout", () => {
      canvasWrapperRef.current?.classList.remove(styles.panning);
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
