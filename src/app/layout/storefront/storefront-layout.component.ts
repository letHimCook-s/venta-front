import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LandingConfigService } from '../../core/services/landing-config.service';

type NavbarIcon = 'user' | 'cart';

interface NavbarConfig {
  brandName: string;
  logoMode: 'icon-text' | 'image';
  logoUrl: string | null;
  categories: string[];
  searchPlaceholder: string;
  showSearch: boolean;
  showUserIcon: boolean;
  showCartIcon: boolean;
  searchPosition: 'start' | 'end';
  iconOrder: NavbarIcon[];
}

const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
  brandName: 'Giga Shop',
  logoMode: 'icon-text',
  logoUrl: null,
  categories: ['Contactanos', 'Descubrir', 'Software', 'Ofertas'],
  searchPlaceholder: 'Buscar.....',
  showSearch: true,
  showUserIcon: true,
  showCartIcon: true,
  searchPosition: 'start',
  iconOrder: ['user', 'cart']
};

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink],
  templateUrl: './storefront-layout.component.html',
  styleUrl: './storefront-layout.component.scss'
})
export class StorefrontLayoutComponent implements OnInit, OnDestroy {
  navbarConfig: NavbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
  categoriesInput = this.navbarConfig.categories.join(', ');
  isCustomizerOpen = false;

  private configSub?: Subscription;

  constructor(private readonly landingConfigService: LandingConfigService) {}

  ngOnInit(): void {
    this.landingConfigService.init();
    this.loadFromConfigService();

    this.configSub = this.landingConfigService.config$.subscribe(() => {
      this.loadFromConfigService();
    });
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  toggleCustomizer(): void {
    this.isCustomizerOpen = !this.isCustomizerOpen;
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.navbarConfig.logoUrl = typeof reader.result === 'string' ? reader.result : null;
      this.navbarConfig.logoMode = this.navbarConfig.logoUrl ? 'image' : 'icon-text';
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
    this.navbarConfig.iconOrder = nextOrder;
  }

  moveIconRight(icon: NavbarIcon): void {
    const nextOrder = [...this.navbarConfig.iconOrder];
    const index = nextOrder.indexOf(icon);
    if (index === -1 || index >= nextOrder.length - 1) {
      return;
    }

    [nextOrder[index + 1], nextOrder[index]] = [nextOrder[index], nextOrder[index + 1]];
    this.navbarConfig.iconOrder = nextOrder;
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

  get visibleIcons(): NavbarIcon[] {
    return this.navbarConfig.iconOrder.filter((icon) => this.isIconVisible(icon));
  }

  private loadFromConfigService(): void {
    const section = this.landingConfigService.getSectionConfig('navbar');
    const rawConfig = section?.fabricJson;

    if (!this.isNavbarConfig(rawConfig)) {
      this.navbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
      this.categoriesInput = this.navbarConfig.categories.join(', ');
      return;
    }

    this.navbarConfig = {
      ...DEFAULT_NAVBAR_CONFIG,
      ...rawConfig,
      categories:
        rawConfig.categories.length > 0
          ? [...rawConfig.categories]
          : [...DEFAULT_NAVBAR_CONFIG.categories],
      iconOrder:
        rawConfig.iconOrder.length > 0
          ? [...rawConfig.iconOrder]
          : [...DEFAULT_NAVBAR_CONFIG.iconOrder]
    };
    this.categoriesInput = this.navbarConfig.categories.join(', ');
  }

  private isIconVisible(icon: NavbarIcon): boolean {
    if (icon === 'user') {
      return this.navbarConfig.showUserIcon;
    }

    return this.navbarConfig.showCartIcon;
  }

  private isNavbarConfig(value: unknown): value is NavbarConfig {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<NavbarConfig>;
    return (
      typeof candidate.brandName === 'string' &&
      (candidate.logoMode === 'icon-text' || candidate.logoMode === 'image') &&
      (typeof candidate.logoUrl === 'string' || candidate.logoUrl === null) &&
      Array.isArray(candidate.categories) &&
      candidate.categories.every((item) => typeof item === 'string') &&
      typeof candidate.searchPlaceholder === 'string' &&
      typeof candidate.showSearch === 'boolean' &&
      typeof candidate.showUserIcon === 'boolean' &&
      typeof candidate.showCartIcon === 'boolean' &&
      (candidate.searchPosition === 'start' || candidate.searchPosition === 'end') &&
      Array.isArray(candidate.iconOrder) &&
      candidate.iconOrder.every((item) => item === 'user' || item === 'cart')
    );
  }
}
