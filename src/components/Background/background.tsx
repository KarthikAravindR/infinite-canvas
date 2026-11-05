import React from "react";
import type { CSSProperties, JSX } from "react";
import type { ZoomState } from "../../App";
import { clampValue } from "../../helpers/utils";

import styles from "./styles.module.css";

export interface BackgroundProps {
  id?: string;
  disable?: boolean;
  size?: number;
  minSize?: number;
  maxZoom?: number;
  gap?: number;
  zoomTransform?: ZoomState;
  className?: string;
  minOpacity?: number;
  maxOpacity?: number;
  elementColor?: string;
  backgroundColor?: CSSProperties["backgroundColor"];
}

let counter = 0;
// React 17 has no useId, so fall back to a module counter. Chosen once, at load.
const useStableId: () => string =
  typeof React.useId === "function"
    ? React.useId
    : () => React.useState(() => String(++counter))[0];

export const Background = ({
  id = "",
  size = 1,
  minSize = 0.3,
  maxZoom = 4,
  gap = 20,
  zoomTransform = {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  className = "",
  minOpacity = 0.8,
  maxOpacity = 1,
  elementColor = "#afb7c7",
  backgroundColor,
}: BackgroundProps): JSX.Element => {
  const { scale, translateX, translateY } = zoomTransform;
  const dynamicOpacity = clampValue({
    value: (scale * 10) / (maxZoom * 10),
    min: minOpacity,
    max: maxOpacity,
  });
  const scaledGap = gap * scale;
  const scaledSize = size * scale;
  const circleSize = Math.max(minSize, scaledSize);
  // Strip characters such as the colons in React 18 ids: the id goes inside url(#...).
  const stableId = useStableId().replace(/[^A-Za-z0-9_-]/g, "");
  const patternId = id ? `patternId-${id}` : `ric-pattern-${stableId}`;

  return (
    <svg
      className={`${className} ${styles.dotSvgContainer}`}
      style={backgroundColor ? { backgroundColor: backgroundColor } : {}}
      role="img"
      aria-label="Background pattern"
    >
      <pattern
        id={patternId}
        x={translateX % scaledGap}
        y={translateY % scaledGap}
        width={scaledGap}
        height={scaledGap}
        patternUnits="userSpaceOnUse"
        patternTransform={`translate(-${scaledSize},-${scaledSize})`}
      >
        <circle
          cx={circleSize}
          cy={circleSize}
          r={circleSize}
          fill={elementColor}
          opacity={dynamicOpacity}
        />
      </pattern>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={`url(#${patternId})`}
      />
    </svg>
  );
};
