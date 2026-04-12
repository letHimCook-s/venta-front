import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AttributesManagerComponent } from '../attributes/components/attributes-manager.component';
import { CategoriesTableComponent } from '../categories/components/categories-table.component';

type AdminCatalogSection = 'categories' | 'attributes';

@Component({
  selector: 'app-admin-catalog-page',
  standalone: true,
  imports: [CommonModule, CategoriesTableComponent, AttributesManagerComponent],
  templateUrl: './admin-catalog.page.html',
  styleUrl: './admin-catalog.page.scss'
})
export class AdminCatalogPage implements OnChanges {
  @Input() initialSection: AdminCatalogSection = 'categories';

  activeSection: AdminCatalogSection = 'categories';
  createCategoryRequestId = 0;
  openCreateAttributeRequestId = 0;
  isAttributeInspectorVisible = false;

  ngOnChanges(changes: SimpleChanges): void {
    const sectionChange = changes['initialSection'];
    if (!sectionChange) {
      return;
    }

    this.activeSection = sectionChange.currentValue ?? 'categories';
  }

  createCategoryFromHeader(): void {
    this.activeSection = 'categories';
    this.isAttributeInspectorVisible = false;
    this.createCategoryRequestId += 1;
  }

  createAttributeFromHeader(): void {
    this.activeSection = 'attributes';
    this.isAttributeInspectorVisible = true;
    this.openCreateAttributeRequestId += 1;
  }

  onAttributeInspectorVisibilityChange(isVisible: boolean): void {
    this.isAttributeInspectorVisible = isVisible;
  }
}
