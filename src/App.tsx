/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { forwardRef, useEffect } from "react";

import useChildrenStore from "./store/children";
import { ReactInfiniteCanvasProps } from "./canva/types";
import { ReactInfiniteCanvasRenderer } from "./canva/renderer/Renderer";

export const ReactInfiniteCanvas: React.FC<ReactInfiniteCanvasProps> =
  forwardRef(({ children, ...restProps }, ref) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const { setRef } = useChildrenStore();

    useEffect(() => {
      console.log("refset");
      setRef(wrapperRef);
    }, []);

    return (
      <ReactInfiniteCanvasRenderer innerRef={ref} {...restProps}>
        <div
          ref={wrapperRef}
          style={{ width: "max-content", height: "max-content" }}
        >
          {children}
        </div>
      </ReactInfiniteCanvasRenderer>
    );
  });
