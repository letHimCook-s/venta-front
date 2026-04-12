import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
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
export class ProductsTableComponent implements OnChanges {
  @Input() products: AdminProduct[] = [];
  @Input() filterProducts: AdminProduct[] = [];
  @Input() filtersToggleActive = false;
  @Input() showFilters = false;

  @Output() createRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<string>();
  @Output() toggleRequested = new EventEmitter<string>();
  @Output() filtersToggleRequested = new EventEmitter<void>();
  @Output() filtersChange = new EventEmitter<ProductTableFilters>();

  viewMode: 'table' | 'grid' = 'table';
  filtersColumnLayout = false;
  private readonly carouselIndexByProduct: Record<string, number> = {};

  get visibleProducts(): AdminProduct[] {
    return this.products
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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

  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
  }

  onFiltersLayoutChange(isColumnLayout: boolean): void {
    this.filtersColumnLayout = isColumnLayout;
  }

  ngOnChanges(): void {
    if (!this.showFilters && this.filtersColumnLayout) {
      this.filtersColumnLayout = false;
    }
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
