"use client";

import { useRef } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

const MAX_BYTES = 5 * 1024 * 1024;

export function ReceiptScanner({ onScanComplete }) {
  const inputRef = useRef(null);
  const { loading, fn } = useFetch(scanReceipt);

  const handleFile = async (file) => {
    if (file.size > MAX_BYTES) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    const data = await fn(file);
    if (data) onScanComplete(data);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-70"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
        </span>
        <span>
          <span className="block text-sm font-medium">{loading ? "Reading your receipt…" : "Scan a receipt"}</span>
          <span className="block text-xs text-muted-foreground">
            Upload a photo and we&apos;ll fill in the amount, date and category.
          </span>
        </span>
      </button>
    </>
  );
}
