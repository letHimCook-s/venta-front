import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AttributesManagerComponent } from '../../attributes/components/attributes-manager.component';
import { CategoriesTableComponent } from '../components/categories-table.component';

type CatalogSection = 'categories' | 'attributes';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [CommonModule, CategoriesTableComponent, AttributesManagerComponent],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss'
})
export class AdminCategoriesPage {
  activeSection: CatalogSection = 'categories';
  createCategoryRequestId = 0;

  constructor(private readonly router: Router) {
    if (this.router.url.includes('/admin/attributes')) {
      this.activeSection = 'attributes';
    }
  }

  selectSection(section: CatalogSection): void {
    this.activeSection = section;
  }

  createCategoryFromHeader(): void {
    this.activeSection = 'categories';
    this.createCategoryRequestId += 1;
  }
}
