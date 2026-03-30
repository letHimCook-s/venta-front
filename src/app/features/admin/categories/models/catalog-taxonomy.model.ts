export type AttributeValueType = 'text' | 'number' | 'select' | 'color' | 'size';

export interface CatalogAttribute {
  id: string;
  name: string;
  code: string;
  valueType: AttributeValueType;
  options: string[];
  required: boolean;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  childrenIds: string[];
  attributeIds: string[];
}

export interface CatalogTaxonomyState {
  categories: CategoryNode[];
  attributes: CatalogAttribute[];
  updatedAt: string;
}

export interface UpsertAttributeInput {
  id?: string;
  name: string;
  code?: string;
  valueType: AttributeValueType;
  options?: string[];
  required: boolean;
}

export interface UpsertCategoryInput {
  id?: string;
  name: string;
  parentId: string | null;
  attributeIds: string[];
}

export interface FlatCategoryNode {
  node: CategoryNode;
  level: number;
  path: string;
}
