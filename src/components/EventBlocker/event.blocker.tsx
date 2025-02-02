import { getBlockClassName } from "../../helpers/utils";

export interface EventBlockerProps {
  children: React.ReactNode;
  shouldBlockScroll?: boolean;
  shouldBlockZoom?: boolean;
  shouldBlockPan?: boolean;
}

export const EventBlocker: React.FC<EventBlockerProps> = ({
  children,
  shouldBlockScroll = true,
  shouldBlockZoom = true,
  shouldBlockPan = true
}) => {
  const blockClassName = getBlockClassName(shouldBlockScroll, shouldBlockZoom, shouldBlockPan);
  return <div className={`${blockClassName}`}>
    {children}
  </div>;
};
