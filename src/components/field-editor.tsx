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
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2 } from "lucide-react";

const DATA_TYPES: FieldType[] = [
  "string",
  "number",
  "boolean",
  "null",
  "map",
  "array",
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

  const renderValueInput = () => {
    switch (field.type) {
      case "string":
        return (
          <Input
            placeholder="String value"
            value={String(field.value ?? "")}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            className="h-9"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder="Number value"
            value={String(field.value ?? 0)}
            onChange={(e) => onUpdate(field.id, { value: Number(e.target.value) })}
            className="h-9"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center h-9">
            <Switch
              checked={!!field.value}
              onCheckedChange={(checked) => onUpdate(field.id, { value: checked })}
            />
          </div>
        );
      default:
        return <div className="h-9" />;
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
          onValueChange={(type: FieldType) => onUpdate(field.id, { type, value: null })}
        >
          <SelectTrigger className="w-48 h-9">
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
