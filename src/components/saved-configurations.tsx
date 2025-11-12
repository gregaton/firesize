"use client";

import type { SavedConfiguration } from "@/types";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/firestore-size";
import { Trash2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface SavedConfigurationsListProps {
  configs: SavedConfiguration[];
  onLoad: (config: SavedConfiguration) => void;
  onDelete: (id: string) => void;
}

export function SavedConfigurationsList({
  configs,
  onLoad,
  onDelete,
}: SavedConfigurationsListProps) {
  if (configs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-4 text-center">
        No saved configurations yet.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Load Configuration</h4>
      {configs.map((config) => (
        <div
          key={config.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex-grow overflow-hidden">
            <p className="font-medium truncate" title={config.name}>{config.name}</p>
            <p className="text-sm text-muted-foreground truncate" title={config.fullDocumentPath}>
              {config.fullDocumentPath}
            </p>
            <p className="text-sm font-bold text-primary">
              {formatBytes(config.totalSize)}
            </p>
          </div>
          <div className="flex items-center shrink-0 ml-2">
            <Button variant="ghost" size="icon" onClick={() => onLoad(config)} title="Load">
              <Upload className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the saved configuration "{config.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(config.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
