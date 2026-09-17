"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { courseNoteInfo, COURSE_NOTES } from "@/lib/gpa/taxonomy";
import type { CourseNote } from "@/lib/gpa/taxonomy";

/**
 * course-note-badge.tsx — Smart badge for academic course-level symbols
 * (Sup / Sub / Inc / Cro / Rtk / Rst). Shows a short code pill that reveals a
 * localized explanation on hover / focus / tap.
 */

type Props = {
  note: string | null | undefined;
  /** Localized descriptions keyed by course-note code. */
  descriptions: Partial<Record<CourseNote, string>>;
};

const NOTE_VARIANT: Record<CourseNote, "secondary" | "destructive" | "warning" | "muted"> = {
  [COURSE_NOTES.NONE]: "muted",
  [COURSE_NOTES.SUP]: "secondary",
  [COURSE_NOTES.SUB]: "warning",
  [COURSE_NOTES.INC]: "destructive",
  [COURSE_NOTES.CRO]: "secondary",
  [COURSE_NOTES.RTK]: "muted",
  [COURSE_NOTES.RST]: "muted",
};

export function CourseNoteBadge({ note, descriptions }: Props) {
  if (!note || note === COURSE_NOTES.NONE) return null;

  const isNote = Object.values(COURSE_NOTES).includes(note as CourseNote);
  if (!isNote) {
    // Unknown code — render raw, silently.
    return <Badge variant="muted" className="font-mono">{note}</Badge>;
  }

  const code = note as CourseNote;
  const meta = courseNoteInfo(code);
  const tooltip = descriptions?.[code] ?? meta.description;

  return (
    <span className="group/badge relative inline-flex">
      <Badge
        variant={NOTE_VARIANT[code]}
        className="cursor-help font-mono"
        tabIndex={0}
      >
        {code}
        <Info className="ms-1 size-3 opacity-70" aria-hidden />
      </Badge>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-md border bg-popover p-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-focus-within/badge:opacity-100 group-hover/badge:opacity-100"
      >
        <span className="mb-0.5 block font-semibold">{meta.en}</span>
        {tooltip}
      </span>
    </span>
  );
}