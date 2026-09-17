"use client";

import * as React from "react";

/**
 * announcement-close.tsx — Client wrapper that persists the user's choice to
 * dismiss the live announcement banner (localStorage per locale document).
 */

const STORAGE_KEY = "caip:banner:dismissed";

type Props = {
  children: (dismissed: boolean, onDismiss: () => void) => React.ReactNode;
};

export function CloseAnnouncement({ children }: Props) {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // storage can be unavailable (private mode) — treat as not dismissed
    }
  }, []);

  const onDismiss = React.useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage write failures
    }
  }, []);

  return <>{children(dismissed, onDismiss)}</>;
}