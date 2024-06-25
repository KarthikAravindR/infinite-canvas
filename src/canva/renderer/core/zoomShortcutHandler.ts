import { ZOOM_CONTROLS } from "../../../helpers/constants";
import { ZOOM_KEY_CODES } from "../../constants";

export function zoomShortcutHandler({ onActionClick }) {
  function onKeyDownHandler(e: KeyboardEvent) {
    const cmdPressed = e.metaKey || e.ctrlKey;
    console.log(e.which, e.code, e.key);
    if (!Object.values(ZOOM_KEY_CODES).includes(e.which) || !cmdPressed) return;
    e.preventDefault();
    switch (e.which) {
      case ZOOM_KEY_CODES.ZOOM_IN:
      case ZOOM_KEY_CODES.ZOOM_IN_2:
        onActionClick(ZOOM_CONTROLS.ZOOM_IN);
        break;
      case ZOOM_KEY_CODES.ZOOM_OUT:
      case ZOOM_KEY_CODES.ZOOM_OUT_2:
        onActionClick(ZOOM_CONTROLS.ZOOM_OUT);
        break;
      case ZOOM_KEY_CODES.FIT_TO_VIEW:
        onActionClick(ZOOM_CONTROLS.FIT_TO_VIEW);
        break;
      case ZOOM_KEY_CODES.FIT_TO_HUNDRED:
        onActionClick(ZOOM_CONTROLS.FIT_TO_HUNDRED);
        break;
      default:
        return;
    }
  }

  window.addEventListener("keydown", onKeyDownHandler);
  return () => {
    window.removeEventListener("keydown", onKeyDownHandler);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}
