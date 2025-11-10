"use client";

import { useMemo, useState } from "react";
import type { Field, FieldNode, FieldType } from "@/types";
import { buildFieldTree, calculateDocumentSize } from "@/lib/firestore-size";
import SizeVisualizer from "./size-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldList } from "./field-editor";

const INITIAL_FIELDS: Field[] = [
  { id: 's1', parentId: 'single', name: 'author', type: 'string', value: 'Jane Doe', size: 8 },
  { id: 's2', parentId: 'single', name: 'views', type: 'number', value: 12345 },
  { id: 'r1', parentId: 'repeated', name: 'comment', type: 'string', value: 'This is an example comment.', size: 27 },
  { id: 'r2', parentId: 'repeated', name: 'likes', type: 'number', value: 10 },
];

export default function FirestoreSizer() {
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);
  const [multiplier, setMultiplier] = useState(1);
  const [documentId, setDocumentId] = useState("my-awesome-document-id");

  const handleUpdateField = (id: string, updates: Partial<Field>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleAddField = (parentId: string, parentType?: FieldType) => {
    const newField: Field = {
      id: crypto.randomUUID(),
      parentId,
      name: parentType === "array" ? "" : `newField${fields.length}`,
      type: "string",
      value: "",
      size: 0,
    };
    setFields((prev) => [...prev, newField]);
  };

  const handleDeleteField = (id: string) => {
    const idsToDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      const sizeBefore = idsToDelete.size;
      fields.forEach(f => {
        if (f.parentId && idsToDelete.has(f.parentId)) {
          idsToDelete.add(f.id);
        }
      });
      if (idsToDelete.size > sizeBefore) {
        changed = true;
      }
    }
    setFields((prev) => prev.filter((f) => !idsToDelete.has(f.id)));
  };

  const documentTree = useMemo(() => {
    const singleFieldsTree = buildFieldTree(fields, 'single');
    const repeatedFieldsTree = buildFieldTree(fields, 'repeated');
    
    if (multiplier > 0 && repeatedFieldsTree.length > 0) {
      const repeatedItemsArray: FieldNode = {
        id: 'repeated-items-array',
        name: 'repeated_items',
        type: 'array',
        value: null,
        children: Array.from({ length: multiplier }, (_, i) => ({
          id: `map-item-${i}`,
          name: '',
          type: 'map',
          value: null,
          children: repeatedFieldsTree.map(f => ({
            ...f,
            // ensure unique IDs within the constructed tree for calculations, though not strictly needed by logic
            id: `${f.id}-${i}`
          })),
        })),
        size: 0
      };
      return [...singleFieldsTree, repeatedItemsArray];
    }
    
    return singleFieldsTree;

  }, [fields, multiplier]);

  const totalSize = useMemo(() => calculateDocumentSize(documentTree, documentId), [documentTree, documentId]);

  const fieldHandlers = {
    onUpdate: handleUpdateField,
    onAdd: handleAddField,
    onDelete: handleDeleteField,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="docId">Document ID</Label>
                    <Input id="docId" value={documentId} onChange={e => setDocumentId(e.target.value)} />
                    <p className="text-sm text-muted-foreground mt-1">The ID of the document itself is part of its size.</p>
                </div>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList
              allFields={fields}
              parentId="single"
              {...fieldHandlers}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Repeated Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Fields defined here will be placed inside an array of maps. Use the multiplier to simulate multiple entries.
            </p>
            <FieldList
              allFields={fields}
              parentId="repeated"
              {...fieldHandlers}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Multiplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="multiplier">Number of repeated entries</Label>
              <Input
                id="multiplier"
                type="number"
                min="0"
                value={multiplier}
                onChange={(e) => setMultiplier(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="sticky top-8">
          <SizeVisualizer calculatedSize={totalSize} />
        </div>
      </div>
    </div>
  );
}
