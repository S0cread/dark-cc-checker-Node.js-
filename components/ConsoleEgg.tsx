"use client";

import { useEffect } from "react";

export function ConsoleEgg() {
  useEffect(() => {
    const blockDevTools = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const blockContext = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("keydown", blockDevTools);
    document.addEventListener("contextmenu", blockContext);

    return () => {
      document.removeEventListener("keydown", blockDevTools);
      document.removeEventListener("contextmenu", blockContext);
    };
  }, []);

  useEffect(() => {
    const art = `
%c
 ██████╗ ██╗██████╗ ███████╗███╗   ███╗███████╗███╗   ██╗
██╔════╝ ██║██╔══██╗██╔════╝████╗ ████║██╔════╝████╗  ██║
██║  ███╗██║██████╔╝█████╗  ██╔████╔██║█████╗  ██╔██╗ ██║
██║   ██║██║██╔══██╗██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║
╚██████╔╝██║██║  ██║███████╗██║ ╚═╝ ██║███████╗██║ ╚████║
 ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝
`;

    console.log(
      art,
      "color: #a855f7; font-family: monospace; font-size: 10px; line-height: 1.2;"
    );
    console.log(
      "%cBuraya bakıyorsun, saygı duyuyorum.",
      "color: #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 600;"
    );
    console.log(
      "%cNext.js · Tailwind · Framer Motion ile inşa edildi.",
      "color: #94a3b8; font-family: monospace; font-size: 11px;"
    );
  }, []);

  return null;
}
