import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
  AdminProduct,
  ProductsAdminState,
  UpsertAdminProductInput
} from '../models/admin-product.model';

interface DiscountOfferOptions {
  campaignName?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductsService {
  private readonly storageKey = 'admin:products:v1';
  private readonly isBrowser: boolean;

  private readonly stateSubject = new BehaviorSubject<ProductsAdminState>(
    this.buildSeedState()
  );

  readonly state$ = this.stateSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (!this.isBrowser) {
      return;
    }

    const stored = this.loadState();
    if (stored) {
      this.stateSubject.next(stored);
      return;
    }

    this.persistState(this.stateSubject.value);
  }

  getSnapshot(): ProductsAdminState {
    return this.stateSubject.value;
  }

  upsertProduct(input: UpsertAdminProductInput): AdminProduct {
    const state = this.stateSubject.value;

    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error('El nombre del producto es obligatorio.');
    }

    const cleanSku = input.sku.trim().toUpperCase();
    if (!cleanSku) {
      throw new Error('El SKU del producto es obligatorio.');
    }

    if (!Number.isFinite(input.price) || input.price < 0) {
      throw new Error('El precio debe ser un numero mayor o igual a 0.');
    }

    if (!Number.isFinite(input.stock) || input.stock < 0) {
      throw new Error('El stock debe ser un numero mayor o igual a 0.');
    }

    if (input.images.length > 5) {
      throw new Error('Solo se permiten hasta 5 imagenes por producto.');
    }

    if (input.videos.length > 1) {
      throw new Error('Solo se permite 1 video por producto.');
    }

    const duplicatedSku = state.products.some(
      (item) => item.sku.toUpperCase() === cleanSku && item.id !== input.id
    );

    if (duplicatedSku) {
      throw new Error('Ya existe un producto con ese SKU.');
    }

    const now = new Date().toISOString();
    const existing = input.id
      ? state.products.find((item) => item.id === input.id)
      : undefined;

    if (input.id && !existing) {
      throw new Error('No se encontro el producto que intentas editar.');
    }

    const normalized: AdminProduct = {
      id: existing?.id ?? this.createId('prd'),
      name: cleanName,
      description: input.description.trim(),
      sku: cleanSku,
      price: this.roundPrice(input.price),
      offer: existing?.offer ?? null,
      stock: Math.floor(input.stock),
      status: input.status,
      categoryId: input.categoryId,
      categoryPath: input.categoryPath.trim(),
      attributeValues: [...input.attributeValues],
      images: [...input.images],
      videos: [...input.videos],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null
    };

    const nextProducts = existing
      ? state.products.map((item) => (item.id === existing.id ? normalized : item))
      : [normalized, ...state.products];

    this.commitState({
      products: nextProducts,
      updatedAt: now
    });

    return normalized;
  }

  applyDiscountToProducts(
    productIds: string[],
    discountPercentage: number,
    options?: DiscountOfferOptions
  ): number {
    const uniqueIds = Array.from(new Set(productIds));
    if (!uniqueIds.length) {
      return 0;
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage >= 100) {
      throw new Error('El descuento debe ser un numero mayor a 0 y menor a 100.');
    }

    const campaignName = options?.campaignName?.trim() || null;
    const startsAt = options?.startsAt ?? null;
    const endsAt = options?.endsAt ?? null;

    if (startsAt && endsAt && new Date(startsAt).getTime() > new Date(endsAt).getTime()) {
      throw new Error('La fecha de inicio no puede ser mayor a la fecha fin.');
    }

    const state = this.stateSubject.value;
    const now = new Date().toISOString();
    let updatedCount = 0;

    const nextProducts = state.products.map((item) => {
      if (!uniqueIds.includes(item.id) || item.status === 'deleted') {
        return item;
      }

      const basePrice = item.offer?.originalPrice ?? item.price;
      const discountedPrice = this.roundPrice(
        basePrice * (1 - discountPercentage / 100)
      );

      updatedCount += 1;

      return {
        ...item,
        price: discountedPrice,
        offer: {
          discountPercentage: this.roundPrice(discountPercentage),
          originalPrice: this.roundPrice(basePrice),
          appliedAt: now,
          campaignName,
          startsAt,
          endsAt
        },
        updatedAt: now
      };
    });

    if (!updatedCount) {
      return 0;
    }

    this.commitState({
      products: nextProducts,
      updatedAt: now
    });

    return updatedCount;
  }

  clearDiscountFromProducts(productIds: string[]): number {
    const uniqueIds = Array.from(new Set(productIds));
    if (!uniqueIds.length) {
      return 0;
    }

    const state = this.stateSubject.value;
    const now = new Date().toISOString();
    let updatedCount = 0;

    const nextProducts = state.products.map((item) => {
      if (!uniqueIds.includes(item.id) || !item.offer) {
        return item;
      }

      updatedCount += 1;

      return {
        ...item,
        price: this.roundPrice(item.offer.originalPrice),
        offer: null,
        updatedAt: now
      };
    });

    if (!updatedCount) {
      return 0;
    }

    this.commitState({
      products: nextProducts,
      updatedAt: now
    });

    return updatedCount;
  }

  toggleProductVisibility(productId: string): void {
    const state = this.stateSubject.value;
    const target = state.products.find((item) => item.id === productId);

    if (!target || target.status === 'deleted') {
      return;
    }

    const nextStatus = target.status === 'active' ? 'inactive' : 'active';

    this.commitState({
      products: state.products.map((item) =>
        item.id === productId
          ? {
              ...item,
              status: nextStatus,
              updatedAt: new Date().toISOString()
            }
          : item
      ),
      updatedAt: new Date().toISOString()
    });
  }

  softDeleteProduct(productId: string): void {
    const state = this.stateSubject.value;
    const target = state.products.find((item) => item.id === productId);

    if (!target || target.status === 'deleted') {
      return;
    }

    const now = new Date().toISOString();

    this.commitState({
      products: state.products.map((item) =>
        item.id === productId
          ? {
              ...item,
              status: 'deleted',
              deletedAt: now,
              updatedAt: now
            }
          : item
      ),
      updatedAt: now
    });
  }

  restoreProduct(productId: string): void {
    const state = this.stateSubject.value;
    const target = state.products.find((item) => item.id === productId);

    if (!target || target.status !== 'deleted') {
      return;
    }

    const now = new Date().toISOString();

    this.commitState({
      products: state.products.map((item) =>
        item.id === productId
          ? {
              ...item,
              status: 'inactive',
              deletedAt: null,
              updatedAt: now
            }
          : item
      ),
      updatedAt: now
    });
  }

  private buildSeedState(): ProductsAdminState {
    return {
      products: [],
      updatedAt: new Date().toISOString()
    };
  }

  private loadState(): ProductsAdminState | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<ProductsAdminState>;

      if (!Array.isArray(parsed.products)) {
        return null;
      }

      return {
        products: (parsed.products as AdminProduct[]).map((item) => ({
          ...item,
          offer: item.offer
            ? {
                discountPercentage: this.roundPrice(item.offer.discountPercentage),
                originalPrice: this.roundPrice(item.offer.originalPrice),
                appliedAt: item.offer.appliedAt,
                campaignName: item.offer.campaignName?.trim() || null,
                startsAt: item.offer.startsAt ?? null,
                endsAt: item.offer.endsAt ?? null
              }
            : null
        })),
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  private commitState(next: ProductsAdminState): void {
    this.stateSubject.next(next);
    this.persistState(next);
  }

  private persistState(state: ProductsAdminState): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private roundPrice(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
