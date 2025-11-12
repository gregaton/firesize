"use client";

import { useMemo, useState, useEffect } from "react";
import type { Field, FieldNode, FieldType, DocumentIdType, SavedConfiguration, Configuration } from "@/types";
import { buildFieldTree, calculateDocumentSize, calculateFieldsSize, formatBytes, getUtf8ByteLength } from "@/lib/firestore-size";
import SizeVisualizer from "./size-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldList } from "./field-editor";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { SaveConfigurationDialog } from "./save-configuration-dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { SavedConfigurationsList } from "./saved-configurations";

const INITIAL_FIELDS: Field[] = [
  { id: 's1', parentId: 'single', name: 'author', type: 'string', value: 'Jane Doe', size: 8 },
  { id: 's2', parentId: 'single', name: 'views', type: 'number', value: 12345 },
  { id: 'r1', parentId: 'repeated', name: 'comment', type: 'string', value: 'This is an example comment.', size: 27 },
  { id: 'r2', parentId: 'repeated', name: 'likes', type: 'number', value: 10 },
];

const INITIAL_STATE: Configuration = {
  fields: INITIAL_FIELDS,
  multiplier: 1,
  collectionPath: "users/some_user_id/posts",
  documentIdType: "custom-string" as DocumentIdType,
  customDocumentId: "my_post_id",
}

export default function FirestoreSizer() {
  const [fields, setFields] = useState<Field[]>(INITIAL_STATE.fields);
  const [multiplier, setMultiplier] = useState(INITIAL_STATE.multiplier);
  const [collectionPath, setCollectionPath] = useState(INITIAL_STATE.collectionPath);
  const [documentIdType, setDocumentIdType] = useState<DocumentIdType>(INITIAL_STATE.documentIdType);
  const [customDocumentId, setCustomDocumentId] = useState(INITIAL_STATE.customDocumentId);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SavedConfiguration | null>(null);

  const [savedConfigs, setSavedConfigs] = useLocalStorage<SavedConfiguration[]>('firestore-sizer-configs', []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpdateField = (id: string, updates: Partial<Field>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const newField = { ...f, ...updates };
          if (updates.type === 'array' && !fields.some(child => child.parentId === id)) {
            // Add a default child when type is changed to array
             const newChild: Field = {
                id: crypto.randomUUID(),
                parentId: id,
                name: '',
                type: 'string',
                value: '',
                size: 10
             };
             // Use a timeout to avoid updating state while rendering
             setTimeout(() => setFields(currentFields => [...currentFields, newChild]), 0);
          } else if (updates.type && f.type === 'array' && updates.type !== 'array') {
              // If type is changed from array, remove children
              const idsToDelete = new Set<string>();
              const queue = [id];
              while(queue.length > 0) {
                  const parentId = queue.shift()!;
                  const children = fields.filter(field => field.parentId === parentId);
                  children.forEach(child => {
                      idsToDelete.add(child.id);
                      if (child.type === 'map' || child.type === 'array') {
                          queue.push(child.id);
                      }
                  })
              }
              setTimeout(() => setFields(currentFields => currentFields.filter(field => !idsToDelete.has(field.id))), 0);
          }
          return newField;
        }
        return f;
      })
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

  const documentTree: FieldNode[] = useMemo(() => {
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
            id: `${f.id}-${i}`
          })),
        })),
        size: multiplier
      };
      return [...singleFieldsTree, repeatedItemsArray];
    }
    
    return singleFieldsTree;

  }, [singleFieldsTree, repeatedFieldsTree, multiplier]);

  const documentId = useMemo(() => {
    if (documentIdType === 'auto') return 'ABCDEFGHIJKLMNOPQRST'; // 20 chars
    if (documentIdType === 'custom-int') return '12345678';
    return customDocumentId || "";
  }, [documentIdType, customDocumentId]);

  const fullDocumentPath = useMemo(() => `${collectionPath}/${documentId}`.replace(/^\/|\/$/g, ''), [collectionPath, documentId]);

  const pathSize = useMemo(() => {
    const segments = collectionPath.split('/').filter(p => p.length > 0);
    const pathBytes = segments.reduce((sum, segment) => sum + getUtf8ByteLength(segment) + 1, 0);
    return pathBytes + 16;
  }, [collectionPath]);

  const documentIdSize = useMemo(() => {
      if (documentIdType === 'custom-int') return 8;
      return getUtf8ByteLength(documentId) + 1;
  }, [documentId, documentIdType]);

  const documentDetailsSize = pathSize + documentIdSize + 32;

  const totalSize = useMemo(() => {
    return calculateDocumentSize(fullDocumentPath, documentTree);
  }, [fullDocumentPath, documentTree]);


  const fieldHandlers = {
    onUpdate: handleUpdateField,
    onAdd: handleAddField,
    onDelete: handleDeleteField,
  };
  
  const handleSaveConfiguration = (name: string, isOverwrite: boolean) => {
    const configToSave: Configuration = {
      fields,
      multiplier,
      collectionPath,
      documentIdType,
      customDocumentId,
    };
  
    const existingConfigIndex = savedConfigs.findIndex(c => c.name === name);
    
    const newSavedConfig: SavedConfiguration = {
      id: existingConfigIndex !== -1 ? savedConfigs[existingConfigIndex].id : crypto.randomUUID(),
      name,
      timestamp: new Date().toISOString(),
      config: configToSave,
      totalSize,
      fullDocumentPath,
    };

    if (existingConfigIndex !== -1) {
      // Overwrite existing config
       const newConfigs = [...savedConfigs];
       newConfigs[existingConfigIndex] = newSavedConfig;
       setSavedConfigs(newConfigs);
    } else {
      // Add new config
      setSavedConfigs([newSavedConfig, ...savedConfigs]);
    }
  };

  const handleLoadConfiguration = (configToLoad: SavedConfiguration) => {
    const { config } = configToLoad;
    setFields(config.fields);
    setMultiplier(config.multiplier);
    setCollectionPath(config.collectionPath);
    setDocumentIdType(config.documentIdType);
    setCustomDocumentId(config.customDocumentId);
  };
  
  const handleDeleteConfiguration = (id: string) => {
    setSavedConfigs(savedConfigs.filter(c => c.id !== id));
  }

  const openSaveDialog = (config: SavedConfiguration | null = null) => {
    setEditingConfig(config);
    setIsSaveDialogOpen(true);
  };

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <>
    <SaveConfigurationDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveConfiguration}
        existingNames={savedConfigs.map(c => c.name)}
        editingConfig={editingConfig}
      />
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Document Details</CardTitle>
                <div className="text-sm font-medium text-muted-foreground">{formatBytes(documentDetailsSize)}</div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="collectionPath">Document Path</Label>
                    <div className="text-sm font-medium text-muted-foreground">{formatBytes(pathSize)}</div>
                  </div>
                  <Input id="collectionPath" value={collectionPath} onChange={e => setCollectionPath(e.target.value)} placeholder="e.g., users/user_id" />
                  <p className="text-sm text-muted-foreground mt-1">The collection path leading to the document, e.g., `users/user_id/posts`.</p>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label>Document ID</Label>
                        <div className="text-sm font-medium text-muted-foreground">{formatBytes(documentIdSize)}</div>
                    </div>
                    <RadioGroup value={documentIdType} onValueChange={value => setDocumentIdType(value as DocumentIdType)} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="auto" id="auto" />
                            <Label htmlFor="auto" className="font-normal">Auto-generated ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom-string" id="custom-string" />
                            <Label htmlFor="custom-string" className="font-normal">Custom String</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom-int" id="custom-int" />
                            <Label htmlFor="custom-int" className="font-normal">Integer</Label>
                        </div>
                    </RadioGroup>
                    {documentIdType === 'custom-string' && (
                        <div className="mt-2">
                            <Input id="customDocumentId" value={customDocumentId} onChange={e => setCustomDocumentId(e.target.value)} placeholder="Enter custom string ID" />
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {documentIdType === 'auto' && 'Firestore default 20-character string ID.'}
                      {documentIdType === 'custom-string' && 'A user-defined string ID.'}
                      {documentIdType === 'custom-int' && 'An integer ID (not recommended). Stored as 8 bytes.'}
                    </p>
                </div>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fields</CardTitle>
            <div className="text-sm font-medium text-muted-foreground">{formatBytes(calculateFieldsSize(singleFieldsTree))}</div>
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
             <div className="text-sm font-medium text-muted-foreground">{formatBytes(multiplier > 0 ? calculateFieldsSize(documentTree.filter(f => f.id === 'repeated-items-array')) : 0)}</div>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <p className="text-sm text-muted-foreground !mt-2">
              Fields defined below will be placed inside an array of maps. The array field is named `repeated_items`.
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
        <div className="sticky top-8 space-y-8">
          <SizeVisualizer calculatedSize={totalSize} />
           <Card>
              <CardHeader>
                  <CardTitle>Manage Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                  <Button onClick={() => openSaveDialog()} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save Current Configuration
                  </Button>
                  <SavedConfigurationsList
                    configs={savedConfigs}
                    onLoad={handleLoadConfiguration}
                    onDelete={handleDeleteConfiguration}
                    onEdit={openSaveDialog}
                  />
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
    </>
  );
}
