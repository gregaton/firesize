"use client";

import { useMemo, useState } from "react";
import type { Field, FieldNode, FieldType, DocumentIdType } from "@/types";
import { buildFieldTree, calculateDocumentSize, formatBytes, getUtf8ByteLength } from "@/lib/firestore-size";
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
  const [collectionName, setCollectionName] = useState("my-collection");
  const [documentIdType, setDocumentIdType] = useState<DocumentIdType>("auto");
  const [documentId, setDocumentId] = useState("");
  const [customIdLength, setCustomIdLength] = useState(20);

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

  const effectiveDocumentId = useMemo(() => {
    if (documentIdType === 'auto') {
      return '0'.repeat(20); // Firestore auto-IDs are 20 characters
    }
    if (documentIdType === 'custom-string') {
      return '0'.repeat(customIdLength);
    }
    return documentId;
  }, [documentIdType, documentId, customIdLength]);

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

  const collectionNameSize = useMemo(() => getUtf8ByteLength(collectionName) + 1, [collectionName]);
  const documentIdSize = useMemo(() => getUtf8ByteLength(effectiveDocumentId) + 1, [effectiveDocumentId]);

  const totalSize = useMemo(() => {
    const docSize = calculateDocumentSize(collectionName, effectiveDocumentId, documentTree);
    return docSize;
  }, [collectionName, effectiveDocumentId, documentTree]);


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
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="collectionName">Collection Name</Label>
                    <div className="flex items-center gap-2">
                      <Input id="collectionName" value={collectionName} onChange={e => setCollectionName(e.target.value)} />
                      <div className="h-9 flex items-center justify-end text-sm text-muted-foreground w-28 shrink-0 pr-2">
                        {formatBytes(collectionNameSize)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">The name of the collection path.</p>
                </div>
                 <div>
                    <Label>Document ID</Label>
                    <div className="flex items-center gap-2">
                      <RadioGroup value={documentIdType} onValueChange={(value: string) => setDocumentIdType(value as DocumentIdType)} className="mt-2 flex gap-4 items-center h-9">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto">Auto-generated (20 chars)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom-string" id="custom-string" />
                          <Label htmlFor="custom-string">Custom String</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom-int" id="custom-int" />
                          <Label htmlFor="custom-int">Custom Integer</Label>
                        </div>
                      </RadioGroup>
                      <div className="h-9 flex items-center justify-end text-sm text-muted-foreground w-28 shrink-0 pr-2">
                        {formatBytes(documentIdSize)}
                      </div>
                    </div>
                    {documentIdType === 'custom-string' && (
                       <div className="mt-2">
                          <Label htmlFor="customIdLength" className="text-xs text-muted-foreground">ID Length</Label>
                          <Input 
                            id="customIdLength"
                            type="number"
                            min="1"
                            value={customIdLength} 
                            onChange={e => setCustomIdLength(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            placeholder="Enter custom ID length"
                          />
                       </div>
                    )}
                    {documentIdType === 'custom-int' && (
                       <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Integer IDs are stored as 8 bytes.</p>
                       </div>
                    )}
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
