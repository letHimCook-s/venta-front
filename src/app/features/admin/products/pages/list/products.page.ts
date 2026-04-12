import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductTableFilters } from '../../components/products-filters/products-filters.component';
import { ProductsTableComponent } from '../../components/products-table/products-table.component';
import { AdminProduct } from '../../models/admin-product.model';
import { AdminProductsService } from '../../services/admin-products.service';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [CommonModule, ProductsTableComponent],
  template: `
    <section class="page">
      <header class="page-topbar">
        <div>
          <h1>Gestion de productos</h1>
        </div>
      </header>

      @if (feedbackMessage) {
        <p class="feedback success">{{ feedbackMessage }}</p>
      }

      <app-products-table
        [products]="filteredProducts"
        [filterProducts]="products"
        (createRequested)="openCreateForm()"
        (editRequested)="openEditForm($event)"
        (filtersChange)="onFiltersChange($event)"
        (toggleRequested)="toggleProduct($event)"
        (bulkDeleteRequested)="bulkDeleteProducts($event)"
      ></app-products-table>
    </section>
  `,
  styleUrl: './products.page.scss'
})
export class AdminProductsPage implements OnInit, OnDestroy {
  products: AdminProduct[] = [];
  activeFilters: ProductTableFilters = {
    categoryPath: '',
    attributeId: '',
    attributeValues: [],
    priceMax: null
  };
  feedbackMessage = '';

  private readonly subscription = new Subscription();

  constructor(
    private readonly productsService: AdminProductsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.products = this.productsService.getSnapshot().products;

    const currentNavigation = this.router.getCurrentNavigation();
    const state = currentNavigation?.extras?.state as { feedbackMessage?: string } | undefined;
    this.feedbackMessage = state?.feedbackMessage ?? '';

    this.subscription.add(
      this.productsService.state$.subscribe((state) => {
        this.products = state.products;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openCreateForm(): void {
    this.router.navigate(['/admin/products/new']);
  }

  openEditForm(productId: string): void {
    this.router.navigate(['/admin/products', productId, 'edit']);
  }

  onFiltersChange(filters: ProductTableFilters): void {
    this.activeFilters = filters;
  }

  get filteredProducts(): AdminProduct[] {
    return this.products.filter(
      (item) =>
        this.matchesCategory(item) &&
        this.matchesAttribute(item) &&
        this.matchesAttributeValue(item) &&
        this.matchesAttributeSelections(item) &&
        this.matchesPrice(item)
    );
  }

  toggleProduct(productId: string): void {
    this.productsService.toggleProductVisibility(productId);
    this.feedbackMessage = 'Estado del producto actualizado.';
  }

  bulkDeleteProducts(productIds: string[]): void {
    const deleted = this.productsService.softDeleteProducts(productIds);
    this.feedbackMessage = deleted
      ? `${deleted} producto(s) eliminados en lote.`
      : 'No se eliminaron productos.';
  }

  private matchesCategory(product: AdminProduct): boolean {
    const selectedCategory = this.activeFilters.categoryPath.trim();
    if (!selectedCategory) {
      return true;
    }

    return product.categoryPath === selectedCategory;
  }

  private matchesAttribute(product: AdminProduct): boolean {
    const selectedAttribute = this.activeFilters.attributeId.trim();
    if (!selectedAttribute) {
      return true;
    }

    return product.attributeValues.some((item) => item.attributeId === selectedAttribute);
  }

  private matchesAttributeValue(product: AdminProduct): boolean {
    const selectedAttribute = this.activeFilters.attributeId.trim();
    const selectedValues = this.activeFilters.attributeValues.map((item) => item.trim()).filter((item) => !!item);

    if (!selectedValues.length) {
      return true;
    }

    const selectedSet = new Set(selectedValues);

    if (!selectedAttribute) {
      return product.attributeValues.some((item) => selectedSet.has(item.value.trim()));
    }

    return product.attributeValues.some(
      (item) =>
        item.attributeId === selectedAttribute && selectedSet.has(item.value.trim())
    );
  }

  private matchesAttributeSelections(product: AdminProduct): boolean {
    const selections = this.activeFilters.attributeSelections ?? {};
    const activeEntries = Object.entries(selections)
      .map(([attributeId, values]) => [
        attributeId,
        values.map((item) => item.trim()).filter((item) => !!item)
      ] as const)
      .filter(([, values]) => values.length > 0);

    if (!activeEntries.length) {
      return true;
    }

    return activeEntries.every(([attributeId, values]) => {
      const valueSet = new Set(values);
      return product.attributeValues.some(
        (item) => item.attributeId === attributeId && valueSet.has(item.value.trim())
      );
    });
  }

  private matchesPrice(product: AdminProduct): boolean {
    const priceMax = this.activeFilters.priceMax;
    if (priceMax === null || priceMax === undefined) {
      return true;
    }

    return product.price <= priceMax;
  }
}
