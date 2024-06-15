import { drag, Selection } from "d3-drag";
import { pointer } from "d3-selection";
import { RefObject } from "react";

type DragProps = {
  childComponentRef: RefObject<HTMLElement>;
};

export const defineDragBehavior = (props: DragProps) => {
  const { childComponentRef, ...rest } = props;

  console.log({ props });
  //   if(rest)
  //   rest?.on("mouseover", () => {
  //     console.log("lol");
  //   });

  //   console.log(childComponentSelection);

  const dragBehavior = drag()
    .on("start", (e) => {
      // Actions on drag start
    })
    .on("drag", (event) => {
      const [x, y] = pointer(event);
      if (childComponentRef.current) {
        childComponentRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    })
    .on("end", () => {
      // Actions on drag end
    });

  return dragBehavior;
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
