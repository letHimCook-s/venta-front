import { Component } from '@angular/core';
import { AdminCatalogPage } from '../../pages/admin-catalog.page';

@Component({
  selector: 'app-admin-attributes-page',
  standalone: true,
  imports: [AdminCatalogPage],
  templateUrl: './attributes.page.html',
  styleUrl: './attributes.page.scss'
})
export class AdminAttributesPage {
  readonly initialSection = 'attributes' as const;
}
