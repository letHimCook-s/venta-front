import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminProduct, ProductVideoAsset } from '../../models/admin-product.model';
import {
  ProductTableFilters,
  ProductsFiltersComponent
} from '../products-filters/products-filters.component';

interface ProductMediaSlide {
  kind: 'image' | 'video-file' | 'video-link';
  source: string;
  label: string;
}

@Component({
  selector: 'app-products-table',
  standalone: true,
  imports: [CommonModule, ProductsFiltersComponent],
  templateUrl: './products-table.component.html',
  styleUrl: './products-table.component.scss'
})
export class ProductsTableComponent {
  @Input() products: AdminProduct[] = [];
  @Input() filterProducts: AdminProduct[] = [];

  @Output() createRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<string>();
  @Output() toggleRequested = new EventEmitter<string>();
  @Output() filtersChange = new EventEmitter<ProductTableFilters>();
  @Output() bulkDeleteRequested = new EventEmitter<string[]>();

  viewMode: 'table' | 'grid' = 'table';
  filtersColumnLayout = false;
  searchQuery = '';
  currentPage = 1;
  pageSize = 50;
  readonly pageSizeOptions = [50, 100, 500];
  selectedIds = new Set<string>();
  private readonly carouselIndexByProduct: Record<string, number> = {};

  get visibleProducts(): AdminProduct[] {
    return this.products
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get displayedProducts(): AdminProduct[] {
    const search = this.searchQuery.trim().toLowerCase();
    if (!search) {
      return this.visibleProducts;
    }

    return this.visibleProducts.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
    );
  }

  get paginatedProducts(): AdminProduct[] {
    const start = (this.safeCurrentPage - 1) * this.pageSize;
    return this.displayedProducts.slice(start, start + this.pageSize);
  }

  get allCurrentPageSelected(): boolean {
    return (
      this.paginatedProducts.length > 0 &&
      this.paginatedProducts.every((item) => this.selectedIds.has(item.id))
    );
  }

  get selectedCount(): number {
    return this.displayedProducts.filter((item) => this.selectedIds.has(item.id)).length;
  }

  get safeCurrentPage(): number {
    const totalPages = this.totalPages;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    return this.currentPage;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayedProducts.length / this.pageSize));
  }

  get paginationFrom(): number {
    if (!this.displayedProducts.length) {
      return 0;
    }

    return (this.safeCurrentPage - 1) * this.pageSize + 1;
  }

  get paginationTo(): number {
    if (!this.displayedProducts.length) {
      return 0;
    }

    return Math.min(this.safeCurrentPage * this.pageSize, this.displayedProducts.length);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleString('es-PE');
  }

  hasOffer(product: AdminProduct): boolean {
    return !!product.offer;
  }

  getOriginalPrice(product: AdminProduct): number {
    return product.offer?.originalPrice ?? product.price;
  }

  getDiscountPercentage(product: AdminProduct): number | null {
    return product.offer?.discountPercentage ?? null;
  }

  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  toggleSelection(productId: string, checked: boolean, event?: Event): void {
    event?.stopPropagation();
    if (checked) {
      this.selectedIds.add(productId);
      return;
    }

    this.selectedIds.delete(productId);
  }

  toggleSelectAllCurrentPage(checked: boolean): void {
    if (checked) {
      const next = new Set(this.selectedIds);
      for (const item of this.paginatedProducts) {
        next.add(item.id);
      }
      this.selectedIds = next;
      return;
    }

    const pageIds = new Set(this.paginatedProducts.map((item) => item.id));
    this.selectedIds = new Set(
      Array.from(this.selectedIds).filter((id) => !pageIds.has(id))
    );
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  deleteSelected(): void {
    const selectedFromCurrentFilter = this.displayedProducts
      .filter((item) => this.selectedIds.has(item.id))
      .map((item) => item.id);

    if (!selectedFromCurrentFilter.length) {
      return;
    }

    this.bulkDeleteRequested.emit(selectedFromCurrentFilter);
    this.selectedIds = new Set(
      Array.from(this.selectedIds).filter((id) => !selectedFromCurrentFilter.includes(id))
    );
  }

  onFiltersLayoutChange(isColumnLayout: boolean): void {
    this.filtersColumnLayout = isColumnLayout;
  }

  getCoverImage(product: AdminProduct): string | null {
    return product.images[0]?.dataUrl ?? null;
  }

  isActive(product: AdminProduct): boolean {
    return product.status === 'active';
  }

  getMediaSlides(product: AdminProduct): ProductMediaSlide[] {
    const imageSlides: ProductMediaSlide[] = product.images.map((item) => ({
      kind: 'image',
      source: item.dataUrl,
      label: item.name
    }));

    const videoSlides: ProductMediaSlide[] = product.videos.map((item) =>
      this.mapVideoToSlide(item)
    );

    return [...imageSlides, ...videoSlides];
  }

  getCurrentSlideIndex(product: AdminProduct): number {
    const slides = this.getMediaSlides(product);
    if (!slides.length) {
      return 0;
    }

    const current = this.carouselIndexByProduct[product.id] ?? 0;
    return Math.max(0, Math.min(current, slides.length - 1));
  }

  getCurrentSlide(product: AdminProduct): ProductMediaSlide | null {
    const slides = this.getMediaSlides(product);
    if (!slides.length) {
      return null;
    }

    return slides[this.getCurrentSlideIndex(product)] ?? null;
  }

  nextSlide(product: AdminProduct, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const slides = this.getMediaSlides(product);
    if (slides.length <= 1) {
      return;
    }

    const current = this.getCurrentSlideIndex(product);
    this.carouselIndexByProduct[product.id] = (current + 1) % slides.length;
  }

  prevSlide(product: AdminProduct, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const slides = this.getMediaSlides(product);
    if (slides.length <= 1) {
      return;
    }

    const current = this.getCurrentSlideIndex(product);
    this.carouselIndexByProduct[product.id] =
      (current - 1 + slides.length) % slides.length;
  }

  private mapVideoToSlide(video: ProductVideoAsset): ProductMediaSlide {
    if (video.kind === 'file') {
      return {
        kind: 'video-file',
        source: video.source,
        label: video.name ?? 'Video'
      };
    }

    return {
      kind: 'video-link',
      source: video.source,
      label: video.name ?? 'Video externo'
    };
  }
}
