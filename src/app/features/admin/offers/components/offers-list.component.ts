import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminProduct } from '../../products/models/admin-product.model';

interface BulkDiscountPayload {
  productIds: string[];
  discountPercentage: number;
  campaignName: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

@Component({
  selector: 'app-offers-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offers-list.component.html',
  styleUrl: './offers-list.component.scss'
})
export class OffersListComponent {
  @Input() products: AdminProduct[] = [];
  @Input() isLoading = false;

  @Output() applyBulkDiscount = new EventEmitter<BulkDiscountPayload>();
  @Output() clearBulkDiscount = new EventEmitter<string[]>();

  selectedIds = new Set<string>();
  discountPercentage: number | null = null;
  campaignName = '';
  startsAt = '';
  endsAt = '';
  searchQuery = '';
  selectedCategoryPath = '';
  offerStatusFilter: 'all' | 'with-offer' | 'without-offer' = 'all';

  get visibleProducts(): AdminProduct[] {
    return this.products
      .filter((item) => item.status !== 'deleted')
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get filteredProducts(): AdminProduct[] {
    const search = this.searchQuery.trim().toLowerCase();
    const selectedCategory = this.selectedCategoryPath.trim();

    return this.visibleProducts.filter((item) => {
      if (search) {
        const matchesSearch =
          item.name.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search);
        if (!matchesSearch) {
          return false;
        }
      }

      if (selectedCategory && item.categoryPath.trim() !== selectedCategory) {
        return false;
      }

      if (this.offerStatusFilter === 'with-offer' && !item.offer) {
        return false;
      }

      if (this.offerStatusFilter === 'without-offer' && item.offer) {
        return false;
      }

      return true;
    });
  }

  get categoryOptions(): string[] {
    const categories = new Set(
      this.visibleProducts
        .map((item) => item.categoryPath.trim())
        .filter((item) => !!item)
    );

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }

  get hasAppliedQuickFilters(): boolean {
    return (
      !!this.searchQuery.trim() ||
      !!this.selectedCategoryPath.trim() ||
      this.offerStatusFilter !== 'all'
    );
  }

  get allSelected(): boolean {
    const products = this.filteredProducts;
    return products.length > 0 && products.every((item) => this.selectedIds.has(item.id));
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  toggleSelection(productId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(productId);
      return;
    }

    this.selectedIds.delete(productId);
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const next = new Set(this.selectedIds);
      for (const item of this.filteredProducts) {
        next.add(item.id);
      }
      this.selectedIds = next;
      return;
    }

    const filteredIds = new Set(this.filteredProducts.map((item) => item.id));
    this.selectedIds = new Set(
      Array.from(this.selectedIds).filter((id) => !filteredIds.has(id))
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryPath = '';
    this.offerStatusFilter = 'all';
  }

  submitDiscount(): void {
    if (this.isLoading || !this.selectedCount || this.discountPercentage === null) {
      return;
    }

    const safeDiscount = Number(this.discountPercentage);
    if (!Number.isFinite(safeDiscount) || safeDiscount <= 0 || safeDiscount >= 100) {
      return;
    }

    const normalizedStartsAt = this.startsAt ? this.toIsoStartDate(this.startsAt) : null;
    const normalizedEndsAt = this.endsAt ? this.toIsoEndDate(this.endsAt) : null;

    if (normalizedStartsAt && normalizedEndsAt) {
      if (new Date(normalizedStartsAt).getTime() > new Date(normalizedEndsAt).getTime()) {
        return;
      }
    }

    this.applyBulkDiscount.emit({
      productIds: Array.from(this.selectedIds),
      discountPercentage: safeDiscount,
      campaignName: this.campaignName.trim() || null,
      startsAt: normalizedStartsAt,
      endsAt: normalizedEndsAt
    });
  }

  clearSelectedDiscounts(): void {
    if (this.isLoading || !this.selectedCount) {
      return;
    }

    this.clearBulkDiscount.emit(Array.from(this.selectedIds));
  }

  isInOffer(product: AdminProduct): boolean {
    return !!product.offer;
  }

  getDiscountPrice(product: AdminProduct): number {
    return product.price;
  }

  getOriginalPrice(product: AdminProduct): number {
    return product.offer?.originalPrice ?? product.price;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatOfferDate(isoDate: string | null): string {
    if (!isoDate) {
      return '--';
    }

    return new Date(isoDate).toLocaleDateString('es-PE');
  }

  private toIsoStartDate(dateValue: string): string {
    return new Date(`${dateValue}T00:00:00`).toISOString();
  }

  private toIsoEndDate(dateValue: string): string {
    return new Date(`${dateValue}T23:59:59`).toISOString();
  }
}
