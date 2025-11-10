"use client";

import { useMemo, useState } from "react";
import type { Field, FieldNode, FieldType, DocumentIdType } from "@/types";
import { buildFieldTree, calculateDocumentSize, formatBytes, calculateDocumentPathSize, calculateFieldsSize } from "@/lib/firestore-size";
import SizeVisualizer from "./size-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldList } from "./field-editor";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const INITIAL_FIELDS: Field[] = [
  { id: 's1', parentId: 'single', name: 'author', type: 'string', value: 'Jane Doe', size: 8 },
  { id: 's2', parentId: 'single', name: 'views', type: 'number', value: 12345 },
  { id: 'r1', parentId: 'repeated', name: 'comment', type: 'string', value: 'This is an example comment.', size: 27 },
  { id: 'r2', parentId: 'repeated', name: 'likes', type: 'number', value: 10 },
];

export default function FirestoreSizer() {
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);
  const [multiplier, setMultiplier] = useState(1);
  const [documentPath, setDocumentPath] = useState("users/some_user_id/posts/my_post_id");

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
      size: 10, // Default string size
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


  const singleFieldsTree = useMemo(() => buildFieldTree(fields, 'single'), [fields]);
  const repeatedFieldsTree = useMemo(() => buildFieldTree(fields, 'repeated'), [fields]);

  const documentTree = useMemo(() => {
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

  }, [singleFieldsTree, repeatedFieldsTree, multiplier]);

  const documentDetailsSize = useMemo(() => calculateDocumentPathSize(documentPath) + 32, [documentPath]);
  const singleFieldsSize = useMemo(() => calculateFieldsSize(singleFieldsTree), [singleFieldsTree]);
  const repeatedFieldsSize = useMemo(() => {
     if (multiplier > 0 && repeatedFieldsTree.length > 0) {
       // Size of the wrapper array field name
       const arrayNameSize = "repeated_items".length + 1;
       // Size of each map inside the array
       const singleMapSize = calculateFieldsSize(repeatedFieldsTree);
       return arrayNameSize + (singleMapSize * multiplier);
     }
     return 0;
  }, [repeatedFieldsTree, multiplier]);

  const totalSize = useMemo(() => {
    return calculateDocumentSize(documentPath, documentTree);
  }, [documentPath, documentTree]);


  const fieldHandlers = {
    onUpdate: handleUpdateField,
    onAdd: handleAddField,
    onDelete: handleDeleteField,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Document Details</CardTitle>
                <div className="text-sm font-medium text-muted-foreground">{formatBytes(documentDetailsSize)}</div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="documentPath">Document Path</Label>
                    <div className="flex items-center gap-2">
                      <Input id="documentPath" value={documentPath} onChange={e => setDocumentPath(e.target.value)} placeholder="e.g., users/user_id/posts/post_id" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">The full path to the document, including collection and document IDs.</p>
                </div>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fields</CardTitle>
            <div className="text-sm font-medium text-muted-foreground">{formatBytes(singleFieldsSize)}</div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Repeated Fields</CardTitle>
             <div className="text-sm font-medium text-muted-foreground">{formatBytes(repeatedFieldsSize)}</div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Fields defined here will be placed inside an array of maps. Use the multiplier to simulate multiple entries. The array field is named `repeated_items`.
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
