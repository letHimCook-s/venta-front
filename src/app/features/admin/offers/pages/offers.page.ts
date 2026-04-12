import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OffersListComponent } from '../components/offers-list.component';
import { AdminProduct } from '../../products/models/admin-product.model';
import { AdminProductsService } from '../../products/services/admin-products.service';

@Component({
  selector: 'app-admin-offers-page',
  standalone: true,
  imports: [CommonModule, OffersListComponent],
  templateUrl: './offers.page.html',
  styleUrl: './offers.page.scss'
})
export class AdminOffersPage implements OnInit, OnDestroy {
  products: AdminProduct[] = [];
  feedbackMessage = '';

  private readonly subscription = new Subscription();

  constructor(private readonly productsService: AdminProductsService) {}

  ngOnInit(): void {
    this.products = this.productsService.getSnapshot().products;

    this.subscription.add(
      this.productsService.state$.subscribe((state) => {
        this.products = state.products;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onApplyBulkDiscount(payload: {
    productIds: string[];
    discountPercentage: number;
    campaignName: string | null;
    startsAt: string | null;
    endsAt: string | null;
  }): void {
    const updatedCount = this.productsService.applyDiscountToProducts(
      payload.productIds,
      payload.discountPercentage,
      {
        campaignName: payload.campaignName,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt
      }
    );

    this.feedbackMessage = updatedCount
      ? `Descuento de ${payload.discountPercentage}% aplicado a ${updatedCount} producto(s).`
      : 'No se aplicaron cambios.';
  }

  onClearBulkDiscount(productIds: string[]): void {
    const updatedCount = this.productsService.clearDiscountFromProducts(productIds);

    this.feedbackMessage = updatedCount
      ? `Oferta eliminada de ${updatedCount} producto(s).`
      : 'Los productos seleccionados no tenian oferta activa.';
  }
}
