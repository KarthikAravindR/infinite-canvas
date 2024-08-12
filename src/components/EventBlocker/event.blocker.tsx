import { getBlockClassName } from "../../helpers/utils";

export interface EventBlockerProps {
  children: React.ReactNode;
  shouldBlockScroll?: boolean;
  shouldBlockZoom?: boolean;
}

export const EventBlocker: React.FC<EventBlockerProps> = ({
  children,
  shouldBlockScroll = true,
  shouldBlockZoom = true,
}) => {
  const blockClassName = getBlockClassName(shouldBlockScroll, shouldBlockZoom);
  return <div className={`${blockClassName}`}>{children}</div>;
};
