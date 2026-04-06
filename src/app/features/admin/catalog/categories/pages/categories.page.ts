import { Component } from '@angular/core';
import { AdminCatalogPage } from '../../pages/admin-catalog.page';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [AdminCatalogPage],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss'
})
export class AdminCategoriesPage {
  readonly initialSection = 'categories' as const;
}
