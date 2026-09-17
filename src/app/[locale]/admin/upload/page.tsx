"use client";

import * as React from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUploadPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  async function handleUpload() {
    if (!file) return;
    setStatus("loading");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/ingest-excel", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setMessage(`تم استيراد ${data.imported ?? 0} طالب بنجاح`);
    } else {
      setStatus("error");
      setMessage(data.error ?? "حدث خطأ أثناء الاستيراد");
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>رفع ملف الدرجات (Excel)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition hover:border-primary/60"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0] ?? null);
          }}
        >
          <Upload className="mb-3 size-10 text-primary/50" />
          <p className="text-sm text-muted-foreground">اسحب ملف xlsx هنا أو</p>
          <label className="mt-2 cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
            اختر ملفاً
            <input type="file" accept=".xlsx" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && <p className="mt-2 text-xs text-muted-foreground">{file.name}</p>}
        </div>
        {status === "success" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle className="size-4" /> {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4" /> {message}
          </div>
        )}
        <Button onClick={handleUpload} disabled={!file || status === "loading"} className="w-full">
          {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          رفع وتحديث قاعدة البيانات
        </Button>
      </CardContent>
    </Card>
  );
}
