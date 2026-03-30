import { Component } from '@angular/core';
import { AttributesManagerComponent } from '../components/attributes-manager.component';

@Component({
  selector: 'app-admin-attributes-page',
  standalone: true,
  imports: [AttributesManagerComponent],
  templateUrl: './attributes.page.html',
  styleUrl: './attributes.page.scss'
})
export class AdminAttributesPage {}
