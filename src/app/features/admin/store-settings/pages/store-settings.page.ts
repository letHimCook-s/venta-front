import { Component } from '@angular/core';
import { LandingEditorComponent } from '../components/landing-editor/landing-editor.component';

@Component({
  selector: 'app-admin-store-settings-page',
  standalone: true,
  imports: [LandingEditorComponent],
  templateUrl: './store-settings.page.html',
  styleUrl: './store-settings.page.scss'
})
export class AdminStoreSettingsPage {}
