"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedConfiguration } from "@/types";

interface SaveConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, id?: string) => void;
  existingNames: string[];
  editingConfig: SavedConfiguration | null;
}

export function SaveConfigurationDialog({
  isOpen,
  onClose,
  onSave,
  existingNames,
  editingConfig,
}: SaveConfigurationDialogProps) {
  const [name, setName] = useState("");
  const [showOverwriteAlert, setShowOverwriteAlert] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(editingConfig?.name || "");
    }
  }, [isOpen, editingConfig]);

  const handleSaveClick = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const isEditing = !!editingConfig;
    const isNameTaken = existingNames.includes(trimmedName);

    if (isNameTaken && (!isEditing || (isEditing && editingConfig.name !== trimmedName))) {
      setShowOverwriteAlert(true);
    } else {
      handleConfirmSave();
    }
  };

  const handleConfirmSave = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName, editingConfig?.id);
      onCloseAndReset();
    }
  };
  
  const onCloseAndReset = () => {
    setShowOverwriteAlert(false);
    setName("");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onCloseAndReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit Configuration' : 'Save Configuration'}</DialogTitle>
            <DialogDescription>
              Enter a name for your document configuration to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseAndReset}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showOverwriteAlert} onOpenChange={setShowOverwriteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configuration name exists</AlertDialogTitle>
            <AlertDialogDescription>
              A configuration with the name "{name.trim()}" already exists. Do you want to overwrite it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOverwriteAlert(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Overwrite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
