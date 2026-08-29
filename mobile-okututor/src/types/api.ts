export interface PaginatedResponse<T> {
  content: T[];
  page?: number;
  size?: number;
  total_elements?: number;
  total_pages?: number;
  first?: boolean;
  last?: boolean;
}

export type MaybePaginated<T> = T[] | PaginatedResponse<T>;

export function toList<T>(data: MaybePaginated<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

export function totalElementsOf(data: MaybePaginated<unknown> | null | undefined): number {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  return data.total_elements ?? data.content?.length ?? 0;
}