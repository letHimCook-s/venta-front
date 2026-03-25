import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_FOOTER_CONFIG,
  FooterConfig,
  isFooterConfig
} from '../../../../../../../core/models/landing-layout.model';
import { LandingConfigService } from '../../../../../../../core/services/landing-config.service';

@Component({
  selector: 'app-landing-footer-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-footer-options.component.html',
  styleUrl: './landing-footer-options.component.scss'
})
export class LandingFooterOptionsComponent {
  footerConfig: FooterConfig = { ...DEFAULT_FOOTER_CONFIG };
  socialItemsInput = this.footerConfig.socialItems.join(', ');
  aboutLinksInput = this.footerConfig.aboutLinks.join(', ');
  secureLinksInput = this.footerConfig.secureLinks.join(', ');
  paymentMethodsInput = this.footerConfig.paymentMethods.join(', ');

  constructor(private readonly landingConfigService: LandingConfigService) {
    this.landingConfigService.init();
    this.loadFooterConfig();
  }

  saveFooterConfig(): void {
    const socialItems = this.parseCommaSeparated(this.socialItemsInput);
    const aboutLinks = this.parseCommaSeparated(this.aboutLinksInput);
    const secureLinks = this.parseCommaSeparated(this.secureLinksInput);
    const paymentMethods = this.parseCommaSeparated(this.paymentMethodsInput);

    this.footerConfig = {
      ...this.footerConfig,
      socialItems: socialItems.length ? socialItems : [...DEFAULT_FOOTER_CONFIG.socialItems],
      aboutLinks: aboutLinks.length ? aboutLinks : [...DEFAULT_FOOTER_CONFIG.aboutLinks],
      secureLinks: secureLinks.length ? secureLinks : [...DEFAULT_FOOTER_CONFIG.secureLinks],
      paymentMethods: paymentMethods.length
        ? paymentMethods
        : [...DEFAULT_FOOTER_CONFIG.paymentMethods]
    };

    this.syncInputs();
    this.landingConfigService.saveSection('footer', this.footerConfig);
  }

  resetFooterConfig(): void {
    this.footerConfig = { ...DEFAULT_FOOTER_CONFIG };
    this.syncInputs();
    this.landingConfigService.resetSection('footer');
  }

  private loadFooterConfig(): void {
    const section = this.landingConfigService.getSectionConfig('footer');
    const raw = section?.fabricJson;

    if (!isFooterConfig(raw)) {
      this.footerConfig = { ...DEFAULT_FOOTER_CONFIG };
      this.syncInputs();
      return;
    }

    this.footerConfig = {
      ...DEFAULT_FOOTER_CONFIG,
      ...raw,
      socialItems: raw.socialItems.length ? [...raw.socialItems] : [...DEFAULT_FOOTER_CONFIG.socialItems],
      aboutLinks: raw.aboutLinks.length ? [...raw.aboutLinks] : [...DEFAULT_FOOTER_CONFIG.aboutLinks],
      secureLinks: raw.secureLinks.length ? [...raw.secureLinks] : [...DEFAULT_FOOTER_CONFIG.secureLinks],
      paymentMethods: raw.paymentMethods.length
        ? [...raw.paymentMethods]
        : [...DEFAULT_FOOTER_CONFIG.paymentMethods]
    };
    this.syncInputs();
  }

  private syncInputs(): void {
    this.socialItemsInput = this.footerConfig.socialItems.join(', ');
    this.aboutLinksInput = this.footerConfig.aboutLinks.join(', ');
    this.secureLinksInput = this.footerConfig.secureLinks.join(', ');
    this.paymentMethodsInput = this.footerConfig.paymentMethods.join(', ');
  }

  private parseCommaSeparated(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !!item);
  }
}