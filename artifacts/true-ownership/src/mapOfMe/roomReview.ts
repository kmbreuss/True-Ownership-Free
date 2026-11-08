import { createContext, createElement, useContext, type ButtonHTMLAttributes } from "react";

/** Native room footers keep their layout, but return to the Map during review. */
export const MapRoomReviewReturn = createContext<(() => void) | null>(null);
export const useMapRoomReturn = () => useContext(MapRoomReviewReturn);

export function MapRoomAction({ onClick, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const close = useMapRoomReturn();
  return createElement("button", { type: "button", ...props, disabled: close ? false : disabled, onClick: close || onClick },
    close ? "Done reviewing →" : children);
}
