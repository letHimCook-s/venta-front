import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_NAVBAR_CONFIG,
  isNavbarConfig,
  NavbarConfig,
  NavbarIcon
} from '../../../../../../../core/models/landing-layout.model';
import { LandingConfigService } from '../../../../../../../core/services/landing-config.service';
import { LandingEditorAction } from '../../models/landing-editor.types';

@Component({
  selector: 'app-landing-navbar-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-navbar-options.component.html',
  styleUrl: './landing-navbar-options.component.scss'
})
export class LandingNavbarOptionsComponent {
  @Input() imageUrl = '';

  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() action = new EventEmitter<LandingEditorAction>();

  navbarConfig: NavbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
  categoriesInput = this.navbarConfig.categories.join(', ');

  constructor(private readonly landingConfigService: LandingConfigService) {
    this.landingConfigService.init();
    this.loadNavbarConfig();
  }

  onImageUrlChange(value: string): void {
    this.imageUrlChange.emit(value);
  }

  emit(action: LandingEditorAction): void {
    this.action.emit(action);
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.navbarConfig = {
        ...this.navbarConfig,
        logoUrl: result,
        logoMode: result ? 'image' : 'icon-text'
      };
    };
    reader.readAsDataURL(file);
  }

  moveIconLeft(icon: NavbarIcon): void {
    const nextOrder = [...this.navbarConfig.iconOrder];
    const index = nextOrder.indexOf(icon);
    if (index <= 0) {
      return;
    }

    [nextOrder[index - 1], nextOrder[index]] = [nextOrder[index], nextOrder[index - 1]];
    this.navbarConfig = {
      ...this.navbarConfig,
      iconOrder: nextOrder
    };
  }

  moveIconRight(icon: NavbarIcon): void {
    const nextOrder = [...this.navbarConfig.iconOrder];
    const index = nextOrder.indexOf(icon);
    if (index === -1 || index >= nextOrder.length - 1) {
      return;
    }

    [nextOrder[index + 1], nextOrder[index]] = [nextOrder[index], nextOrder[index + 1]];
    this.navbarConfig = {
      ...this.navbarConfig,
      iconOrder: nextOrder
    };
  }

  saveNavbarConfig(): void {
    const categories = this.categoriesInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => !!value);

    this.navbarConfig = {
      ...this.navbarConfig,
      categories: categories.length ? categories : [...DEFAULT_NAVBAR_CONFIG.categories]
    };

    this.categoriesInput = this.navbarConfig.categories.join(', ');
    this.landingConfigService.saveSection('navbar', this.navbarConfig);
  }

  resetNavbarConfig(): void {
    this.navbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
    this.categoriesInput = this.navbarConfig.categories.join(', ');
    this.landingConfigService.resetSection('navbar');
  }

  private loadNavbarConfig(): void {
    const section = this.landingConfigService.getSectionConfig('navbar');
    const raw = section?.fabricJson;

    if (!isNavbarConfig(raw)) {
      this.navbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
      this.categoriesInput = this.navbarConfig.categories.join(', ');
      return;
    }

    this.navbarConfig = {
      ...DEFAULT_NAVBAR_CONFIG,
      ...raw,
      categories: raw.categories.length ? [...raw.categories] : [...DEFAULT_NAVBAR_CONFIG.categories],
      iconOrder: raw.iconOrder.length ? [...raw.iconOrder] : [...DEFAULT_NAVBAR_CONFIG.iconOrder]
    };
    this.categoriesInput = this.navbarConfig.categories.join(', ');
  }
}