"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { triggerManualReport } from "@/actions/report";

export function GenerateReportButton() {
  const [loading, setLoading] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const result = await triggerManualReport();
      if (result.success) {
        toast.success("Monthly report triggered! Check your inbox shortly.");
      } else {
        toast.error("Failed to generate report.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTrigger}
      disabled={loading}
      variant="outline"
      className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium shadow-sm"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4 text-indigo-500" />
      )}
      {loading ? "Generating..." : "Generate Monthly Report"}
    </Button>
  );
}