import React from "react";
import { loadNotice } from "./notice";

export function NoticeMapRow() {
  try {
    const notice = loadNotice();
    if (!notice) return null;
    return <div className="a1-notice-map-row">
      <span>This week I'm noticing</span>
      <p>{notice.value}{notice.lived.trim() ? ` · ${notice.lived}` : ""}</p>
    </div>;
  } catch {
    return <p role="alert">Your weekly notice could not be read.</p>;
  }
}
