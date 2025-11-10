export type FieldType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'map' | 'timestamp' | 'geopoint' | 'bytes' | 'reference';

export type DocumentIdType = 'auto' | 'custom-string' | 'custom-int';

export interface Field {
  id: string;
  parentId: string; // 'single' for single fields, 'repeated' for repeated fields, or another field's id
  name: string;
  type: FieldType;
  value: string | number | boolean | null;
  size?: number; // For string, bytes, and reference path length
}

export interface FieldNode extends Omit<Field, 'parentId'> {
  children: FieldNode[];
}
