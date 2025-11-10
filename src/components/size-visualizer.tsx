"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes, MAX_DOC_SIZE } from "@/lib/firestore-size";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useMemo } from "react";

interface SizeVisualizerProps {
  calculatedSize: number;
}

export default function SizeVisualizer({
  calculatedSize,
}: SizeVisualizerProps) {
  const percentage = useMemo(
    () => (calculatedSize / MAX_DOC_SIZE) * 100,
    [calculatedSize]
  );
  const isOverLimit = percentage > 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimated Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="font-medium text-2xl text-primary">
              {formatBytes(calculatedSize)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatBytes(MAX_DOC_SIZE)}
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className={isOverLimit ? '[&>div]:bg-destructive' : ''} />
        </div>

        {isOverLimit ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Over Limit!</AlertTitle>
            <AlertDescription>
              Your document size exceeds the 1 MiB limit. Consider restructuring
              your data.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Under Limit</AlertTitle>
            <AlertDescription>
              Your document size is within the 1 MiB limit.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
