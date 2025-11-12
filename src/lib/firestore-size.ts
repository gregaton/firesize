import type { Field, FieldNode, FieldType } from "@/types";

export const MAX_DOC_SIZE = 1 * 1024 * 1024; // 1 MiB

export function getUtf8ByteLength(str: string): number {
  try {
    return new TextEncoder().encode(str).length;
  } catch (e) {
    // Fallback for environments without TextEncoder
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
      const code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s += 2;
      if (code >= 0xdc00 && code <= 0xdfff) i--;
    }
    return s;
  }
}

export function calculateValueSize(field: FieldNode): number {
  switch (field.type) {
    case "string":
      // The +1 is for the null terminator
      return (field.size ?? 0) + 1;
    case "number":
      return 8;
    case "boolean":
      return 1;
    case "null":
      return 1;
    case "timestamp":
        return 8;
    case "geopoint":
        return 16;
    case "bytes":
        return (field.size ?? 0); // No +1 for bytes, it's just the length
    case "reference":
        // This is a rough estimation based on path length.
        // It's /projects/{projectId}/databases/{databaseId}/documents/{...path}
        // Firestore path size is sum of segments + 16.
        // We'll approximate this by just using the user-provided path length.
        return (field.size ?? 0) + 16;
    case "map":
      return field.children.reduce(
        (sum, child) => sum + calculateFieldSize(child, false),
        0
      );
    case "array":
      return field.children.reduce(
        (sum, child) => sum + calculateValueSize(child),
        0
      );
    default:
      return 0;
  }
}

export function calculateFieldSize(field: FieldNode, isArrayElement = false): number {
  // Field name size is only added for map fields, not for array elements
  const nameSize = !isArrayElement && field.name ? getUtf8ByteLength(field.name) + 1 : 0;
  const valueSize = calculateValueSize(field);
  return nameSize + valueSize;
}

export function calculateFieldsSize(fields: FieldNode[]): number {
  return fields.reduce((sum, field) => sum + calculateFieldSize(field), 0);
}


export function buildFieldTree(
  allFields: Field[],
  parentId: string
): FieldNode[] {
  return allFields
    .filter((field) => field.parentId === parentId)
    .map((field) => ({
      ...field,
      children: buildFieldTree(allFields, field.id),
    }));
}


export function calculateDocumentPathSize(fullPath: string): number {
    if (!fullPath) return 0;
    const segments = fullPath.split('/').filter(p => p.length > 0);
    // Each segment in the path costs its UTF-8 size + 1 byte.
    // The path stored in the document name does not include the final document ID segment.
    const pathWithoutDocId = segments.slice(0, -1).join('/');
    return getUtf8ByteLength(pathWithoutDocId);
}


export function calculateDocumentSize(documentPath: string, fields: FieldNode[]): number {
  const segments = documentPath.split('/').filter(p => p);
  const collectionPath = segments.slice(0, -1).join('/');
  const documentId = segments.slice(-1)[0] || '';

  const pathSize = getUtf8ByteLength(collectionPath);
  const docIdSize = getUtf8ByteLength(documentId) + 1;
  const fieldsSize = calculateFieldsSize(fields);
  
  // Total size is document name size + fields size + 32 bytes document overhead
  return pathSize + docIdSize + 16 + fieldsSize + 32; 
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  // Use base 0 for bytes to avoid showing "NaN" for 0 bytes
  const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
