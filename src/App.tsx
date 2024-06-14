/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { cloneElement, forwardRef, useEffect, useRef } from "react";

import useChildrenStore from "./store/children";
import { ReactInfiniteCanvasProps } from "./canva/types";
import { ReactInfiniteCanvasRenderer } from "./canva/renderer/Renderer";

export const ReactInfiniteCanvas: React.FC<ReactInfiniteCanvasProps> =
  forwardRef(({ children, ...restProps }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const childRefs = React.Children.map(children, () => useRef(null));
    const { setRef } = useChildrenStore();
    useEffect(() => {
      childRefs.forEach((childrenRef) => {
        setRef(childrenRef);
      });
    }, [children]);

    const clonedChildren = React.Children.map(children, (child, index) =>
      cloneElement(child, { ref: childRefs[index] })
    );

    return (
      <ReactInfiniteCanvasRenderer innerRef={ref} {...restProps}>
        <div
          ref={wrapperRef}
          style={{ width: "max-content", height: "max-content" }}
        >
          {clonedChildren}
        </div>
      </ReactInfiniteCanvasRenderer>
    );
  });
