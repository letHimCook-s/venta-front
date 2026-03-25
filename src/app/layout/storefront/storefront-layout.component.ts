import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, AuthSession } from '../../features/auth/services/auth.service';
import {
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_NAVBAR_CONFIG,
  FooterConfig,
  isFooterConfig,
  isNavbarConfig,
  NavbarConfig,
  NavbarIcon
} from '../../core/models/landing-layout.model';
import { LandingConfigService } from '../../core/services/landing-config.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './storefront-layout.component.html',
  styleUrl: './storefront-layout.component.scss'
})
export class StorefrontLayoutComponent implements OnInit, OnDestroy {
  navbarConfig: NavbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
  footerConfig: FooterConfig = { ...DEFAULT_FOOTER_CONFIG };
  authSession: AuthSession | null = null;
  userMenuOpen = false;

  private configSub?: Subscription;

  constructor(
    private readonly landingConfigService: LandingConfigService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.landingConfigService.init();
    this.syncAuthSession();
    this.loadNavbarFromConfigService();
    this.loadFooterFromConfigService();

    this.configSub = this.landingConfigService.config$.subscribe(() => {
      this.loadNavbarFromConfigService();
      this.loadFooterFromConfigService();
    });
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.userMenuOpen = false;
  }

  get isAdminSession(): boolean {
    return this.authSession?.role === 'admin';
  }

  socialGlyph(platform: string): string {
    const normalized = platform.toLowerCase().trim();

    if (normalized === 'facebook') {
      return 'f';
    }

    if (normalized === 'instagram') {
      return 'ig';
    }

    if (normalized === 'x' || normalized === 'twitter') {
      return 'x';
    }

    if (normalized === 'tiktok') {
      return 'tt';
    }

    return normalized.slice(0, 2) || '•';
  }

  get visibleIcons(): NavbarIcon[] {
    return this.navbarConfig.iconOrder.filter((icon) => this.isIconVisible(icon));
  }

  onUserIconClick(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.authSession) {
      this.router.navigateByUrl('/auth/login');
      return;
    }

    this.userMenuOpen = !this.userMenuOpen;
  }

  openAdminPanel(): void {
    this.userMenuOpen = false;
    this.router.navigateByUrl('/admin/dashboard');
  }

  logout(): void {
    this.authService.logout();
    this.syncAuthSession();
    this.userMenuOpen = false;
    this.router.navigateByUrl('/tienda');
  }

  private loadNavbarFromConfigService(): void {
    const section = this.landingConfigService.getSectionConfig('navbar');
    const rawConfig = section?.fabricJson;

    if (!isNavbarConfig(rawConfig)) {
      this.navbarConfig = { ...DEFAULT_NAVBAR_CONFIG };
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
  }

  private loadFooterFromConfigService(): void {
    const section = this.landingConfigService.getSectionConfig('footer');
    const rawConfig = section?.fabricJson;

    if (!isFooterConfig(rawConfig)) {
      this.footerConfig = { ...DEFAULT_FOOTER_CONFIG };
      return;
    }

    this.footerConfig = {
      ...DEFAULT_FOOTER_CONFIG,
      ...rawConfig,
      socialItems:
        rawConfig.socialItems.length > 0
          ? [...rawConfig.socialItems]
          : [...DEFAULT_FOOTER_CONFIG.socialItems],
      aboutLinks:
        rawConfig.aboutLinks.length > 0
          ? [...rawConfig.aboutLinks]
          : [...DEFAULT_FOOTER_CONFIG.aboutLinks],
      secureLinks:
        rawConfig.secureLinks.length > 0
          ? [...rawConfig.secureLinks]
          : [...DEFAULT_FOOTER_CONFIG.secureLinks],
      paymentMethods:
        rawConfig.paymentMethods.length > 0
          ? [...rawConfig.paymentMethods]
          : [...DEFAULT_FOOTER_CONFIG.paymentMethods]
    };
  }

  private syncAuthSession(): void {
    this.authSession = this.authService.getSession();
  }

  private isIconVisible(icon: NavbarIcon): boolean {
    if (icon === 'user') {
      return this.navbarConfig.showUserIcon;
    }

    return this.navbarConfig.showCartIcon;
  }

}
