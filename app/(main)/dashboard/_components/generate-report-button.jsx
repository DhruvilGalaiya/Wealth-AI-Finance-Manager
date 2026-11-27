"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerManualReport } from "@/actions/report";

export function GenerateReportButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await triggerManualReport();
    setLoading(false);
    if (result.success) toast.success("Report on its way — check your inbox in a minute.");
    else toast.error(result.error || "Couldn't send the report.");
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Mail />}
      Email me a report
    </Button>
  );
}
