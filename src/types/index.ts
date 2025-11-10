export type FieldType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'map';

export interface Field {
  id: string;
  parentId: string; // 'single' for single fields, 'repeated' for repeated fields, or another field's id
  name: string;
  type: FieldType;
  value: string | number | boolean | null;
}

export interface FieldNode extends Omit<Field, 'parentId'> {
  children: FieldNode[];
}
