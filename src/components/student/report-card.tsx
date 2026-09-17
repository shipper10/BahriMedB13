"use client";

import * as React from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * report-card.tsx — Styled result-slip card rendered from DOM and exported as
 * a high-resolution PNG (Phase 6). Values shown are the student's UNMASKED
 * data since the owner already authenticated on the protected route.
 */

export interface ReportCardData {
  fileName: string;
  studentName: string;
  studentId: string;
  originTag: string;
  status: string;
  cgpa: string;
  yearGpa: string | null;
  percentile: number | null;
  rank: number | null;
  labels: {
    university: string;
    batch: string;
    reportCard: string;
    studentName: string;
    id: string;
    group: string;
    status: string;
    cgpa: string;
    yearGpa: string;
    percentile: string;
    rank: string;
    download: string;
    downloading: string;
  };
}

export function ReportCard({ data }: { data: ReportCardData }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const download = async () => {
    if (!ref.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = data.fileName;
      link.href = dataUrl;
      link.click();
    } catch {
      setError(data.labels.downloading);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Download button (outside the captured node) */}
      <div className="flex w-full flex-wrap items-center gap-3">
        <Button onClick={download} disabled={busy} type="button">
          <Download className="size-4" />
          {busy ? data.labels.downloading : data.labels.download}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      {/* Captured card */}
      <div
        ref={ref}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-primary/20 bg-white text-slate-900 shadow-lg"
      >
        <div className="bg-gradient-to-r from-[#6d28d9] via-[#8b5cf6] to-[#6d28d9] px-6 py-5 text-white">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/80">
            {data.labels.university}
          </p>
          <h3 className="mt-0.5 text-xl font-bold">{data.labels.batch}</h3>
          <p className="mt-1 text-sm text-white/90">{data.labels.reportCard}</p>
        </div>

        <div className="space-y-5 p-6">
          {/* Identity block */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-slate-500">
                {data.labels.studentName}
              </p>
              <p className="text-lg font-bold">{data.studentName}</p>
            </div>
            <div className="text-end">
              <p className="text-xs uppercase text-slate-500">{data.labels.id}</p>
              <p className="font-mono text-lg font-semibold">{data.studentId}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-800">
              {data.labels.group}: {data.originTag}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {data.labels.status}: {data.status}
            </span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label={data.labels.cgpa} value={data.cgpa} highlight />
            {data.yearGpa ? (
              <Metric label={data.labels.yearGpa} value={data.yearGpa} />
            ) : (
              <Metric label={data.labels.yearGpa} value="—" />
            )}
            <Metric
              label={data.labels.percentile}
              value={data.percentile != null ? `${data.percentile.toFixed(1)}%` : "—"}
            />
            <Metric
              label={data.labels.rank}
              value={data.rank != null ? `#${data.rank}` : "—"}
            />
          </div>

          <p className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            © University of Bahri — Faculty of Medicine &amp; Surgery · Batch 13
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-violet-200 bg-violet-50 p-3"
          : "rounded-xl border border-slate-200 bg-slate-50 p-3"
      }
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 text-xl font-bold text-violet-800"
            : "mt-1 text-xl font-bold text-slate-900"
        }
      >
        {value}
      </p>
    </div>
  );
}