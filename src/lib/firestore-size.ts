import type { Field, FieldNode, FieldType } from "@/types";

export const MAX_DOC_SIZE = 1 * 1024 * 1024; // 1 MiB

function getUtf8ByteLength(str: string): number {
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

function calculateValueSize(field: FieldNode): number {
  switch (field.type) {
    case "string":
      // If size is provided, use it for length, otherwise calculate from value
      const stringLength = field.size ?? String(field.value ?? "").length;
      const fakeString = " ".repeat(stringLength);
      return getUtf8ByteLength(fakeString) + 1;
    case "number":
      return 8;
    case "boolean":
      return 1;
    case "null":
      return 1;
    case "map":
      return field.children.reduce(
        (sum, child) => sum + calculateFieldSize(child),
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

function calculateFieldSize(field: FieldNode): number {
  const nameSize = field.name ? getUtf8ByteLength(field.name) + 1 : 0;
  const valueSize = calculateValueSize(field);
  return nameSize + valueSize;
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

export function calculateDocumentSize(doc: FieldNode[], docId: string = ''): number {
  const documentNameSize = getUtf8ByteLength(docId) + 1;
  const collectionIdOverhead = 1; // Assuming a collection name, even empty, takes some overhead
  const pathSize = collectionIdOverhead + documentNameSize;

  const fieldsSize = doc.reduce((sum, field) => sum + calculateFieldSize(field), 0);
  
  return pathSize + fieldsSize + 32; // Document overhead of 32 bytes
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
