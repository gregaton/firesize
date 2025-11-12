"use client";

import React from "react";
import type { Field, FieldType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { calculateFieldSize, formatBytes } from "@/lib/firestore-size";
import { buildFieldTree } from "@/lib/firestore-size";

const DATA_TYPES: FieldType[] = [
  "string",
  "number",
  "boolean",
  "null",
  "map",
  "array",
  "timestamp",
  "geopoint",
  "bytes",
  "reference",
];

interface FieldEditorProps {
  allFields: Field[];
  parentId: string;
  parentType?: FieldType;
  onUpdate: (id: string, updates: Partial<Field>) => void;
  onAdd: (parentId: string, parentType?: FieldType) => void;
  onDelete: (id: string) => void;
}

const FieldRow = ({
  field,
  ...props
}: { field: Field } & Omit<FieldEditorProps, "parentId">) => {
  const { allFields, parentType, onUpdate, onAdd, onDelete } = props;
  const isNameEditable = parentType !== "array";

  const fieldNode = React.useMemo(() => {
    const tree = buildFieldTree(allFields, field.parentId);
    return tree.find(f => f.id === field.id);
  }, [allFields, field.id, field.parentId]);
  
  const fieldSize = fieldNode ? calculateFieldSize(fieldNode, parentType === 'array') : 0;

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        onUpdate(field.id, { size: undefined });
        return;
    }
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    numValue = Math.max(0, Math.min(numValue, 999999));
    onUpdate(field.id, { size: numValue });
  };
  
  const renderValueInput = () => {
    switch (field.type) {
      case "string":
        return (
          <Input
            type="number"
            required
            min={0}
            max={999999}
            placeholder="String length (chars)"
            value={field.size ?? ""}
            onChange={handleSizeChange}
            className="h-9"
          />
        );
      case "bytes":
        return (
          <Input
            type="number"
            required
            min={0}
            max={999999}
            placeholder="Byte length"
            value={field.size ?? ""}
            onChange={handleSizeChange}
            className="h-9"
          />
        );
      case "reference":
         return (
          <Input
            type="number"
            required
            min={0}
            max={999999}
            placeholder="Path length"
            value={field.size ?? ""}
            onChange={handleSizeChange}
            className="h-9"
          />
        );
      case "array":
        return (
          <Input
            type="number"
            required
            min={0}
            max={999999}
            placeholder="Number of elements"
            value={field.size ?? ""}
            onChange={handleSizeChange}
            className="h-9"
          />
        );
      case "number":
      case "boolean":
      case "timestamp":
      case "geopoint":
      case "null":
         return <div className="h-9 w-full" />;
      default:
        return <div className="h-9 w-full" />;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {isNameEditable ? (
          <Input
            placeholder="Field Name"
            value={field.name}
            onChange={(e) => onUpdate(field.id, { name: e.target.value })}
            className="h-9"
          />
        ) : (
          <span className="text-sm text-muted-foreground w-full pl-3">[Array Item]</span>
        )}
        <Select
          value={field.type}
          onValueChange={(type: FieldType) => onUpdate(field.id, { type, value: null, size: type === 'string' || type === 'bytes' || type === 'reference' || type === 'array' ? 1 : undefined })}
        >
          <SelectTrigger className="w-48 h-9 shrink-0">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {DATA_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-full">{renderValueInput()}</div>
        <div className="h-9 flex items-center justify-end text-sm text-muted-foreground w-28 shrink-0 pr-2">
          {formatBytes(fieldSize)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(field.id)}
          className="shrink-0 h-9 w-9"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {(field.type === "map" || field.type === "array") && (
        <div className="pl-6 pt-4 border-l-2 ml-3">
          <FieldList
            allFields={allFields}
            parentId={field.id}
            parentType={field.type}
            onUpdate={onUpdate}
            onAdd={onAdd}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
};

export const FieldList = (props: FieldEditorProps) => {
  const { allFields, parentId, parentType, onAdd } = props;
  const children = allFields.filter((field) => field.parentId === parentId);

  return (
    <div className="space-y-4">
      {children.map((field) => (
        <FieldRow key={field.id} field={field} {...props} />
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAdd(parentId, parentType)}
        className="text-primary hover:text-primary"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add {parentType === "array" ? "Item" : "Field"}
      </Button>
    </div>
  );
};
