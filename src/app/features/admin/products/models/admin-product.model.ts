import { AttributeValueType } from '../../catalog/categories/models/catalog-taxonomy.model';

export type AdminProductStatus = 'active' | 'inactive' | 'deleted';

export interface ProductImageAsset {
  id: string;
  name: string;
  dataUrl: string;
}

export interface ProductVideoAsset {
  id: string;
  kind: 'file' | 'link';
  source: string;
  name?: string;
}

export interface ProductAttributeValue {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  valueType: AttributeValueType;
  value: string;
}

export interface ProductOffer {
  discountPercentage: number;
  originalPrice: number;
  appliedAt: string;
  campaignName: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  offer: ProductOffer | null;
  stock: number;
  status: AdminProductStatus;
  categoryId: string | null;
  categoryPath: string;
  attributeValues: ProductAttributeValue[];
  images: ProductImageAsset[];
  videos: ProductVideoAsset[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductsAdminState {
  products: AdminProduct[];
  updatedAt: string;
}

export interface UpsertAdminProductInput {
  id?: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  status: Exclude<AdminProductStatus, 'deleted'>;
  categoryId: string | null;
  categoryPath: string;
  attributeValues: ProductAttributeValue[];
  images: ProductImageAsset[];
  videos: ProductVideoAsset[];
}
