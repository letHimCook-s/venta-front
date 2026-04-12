import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FlatCategoryNode } from '../../../catalog/categories/models/catalog-taxonomy.model';
import { CatalogTaxonomyService } from '../../../catalog/categories/services/catalog-taxonomy.service';
import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { AdminProduct, UpsertAdminProductInput } from '../../models/admin-product.model';
import { AdminProductsService } from '../../services/admin-products.service';

@Component({
  selector: 'app-admin-product-editor-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  templateUrl: './product-editor-page.html',
  styleUrl: './product-editor-page.scss'
})
export class AdminProductEditorPage implements OnInit, OnDestroy {
  categories: FlatCategoryNode[] = [];
  selectedProduct: AdminProduct | null = null;

  isEditMode = false;
  isMissingProduct = false;

  feedbackMessage = '';
  errorMessage = '';

  private readonly subscription = new Subscription();
  private productId: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productsService: AdminProductsService,
    private readonly taxonomyService: CatalogTaxonomyService
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;

    this.categories = this.taxonomyService.getFlatCategories();
    this.refreshProductState();

    this.subscription.add(
      this.productsService.state$.subscribe(() => {
        this.refreshProductState();
      })
    );

    this.subscription.add(
      this.taxonomyService.state$.subscribe(() => {
        this.categories = this.taxonomyService.getFlatCategories();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get title(): string {
    return this.isEditMode ? 'Editar producto' : 'Nuevo producto';
  }

  get breadcrumbCurrent(): string {
    return this.isEditMode ? 'Editar producto' : 'Nuevo producto';
  }

  backToList(): void {
    this.router.navigate(['/admin/products']);
  }

  saveProduct(input: UpsertAdminProductInput): void {
    this.feedbackMessage = '';
    this.errorMessage = '';

    try {
      this.productsService.upsertProduct(input);

      this.router.navigate(['/admin/products'], {
        state: {
          feedbackMessage: input.id
            ? 'Producto actualizado correctamente.'
            : 'Producto creado correctamente.'
        }
      });
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible guardar el producto.';
    }
  }

  toggleProductVisibility(): void {
    if (!this.selectedProduct || this.selectedProduct.status === 'deleted') {
      return;
    }

    this.productsService.toggleProductVisibility(this.selectedProduct.id);
    this.feedbackMessage = 'Visibilidad del producto actualizada.';
    this.errorMessage = '';
    this.refreshProductState();
  }

  deleteProduct(): void {
    if (!this.selectedProduct || this.selectedProduct.status === 'deleted') {
      return;
    }

    this.productsService.softDeleteProduct(this.selectedProduct.id);
    this.router.navigate(['/admin/products'], {
      state: {
        feedbackMessage: 'Producto eliminado de la tienda sin borrar su historial.'
      }
    });
  }

  private refreshProductState(): void {
    if (!this.productId) {
      this.selectedProduct = null;
      this.isMissingProduct = false;
      return;
    }

    const match =
      this.productsService
        .getSnapshot()
        .products.find((item) => item.id === this.productId) ?? null;

    this.selectedProduct = match;
    this.isMissingProduct = !match;

    if (this.isMissingProduct) {
      this.errorMessage = 'El producto que intentas editar no existe.';
    }
  }
}
