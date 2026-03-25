import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
  createEmptyLandingConfig,
  LandingConfig,
  LandingConfigUpsertRequest,
  LandingSection,
  LandingSectionConfig
} from '../models/landing-config.model';

@Injectable({
  providedIn: 'root'
})
export class LandingConfigService {
  private readonly storageKey = 'storefront:landing-config';
  private readonly isBrowser: boolean;
  private isInitialized = false;

  private readonly configSubject = new BehaviorSubject<LandingConfig>(
    createEmptyLandingConfig()
  );

  readonly config$ = this.configSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  init(): void {
    if (this.isInitialized || !this.isBrowser) {
      return;
    }

    this.configSubject.next(this.readFromStorage());
    this.isInitialized = true;
  }

  getSectionConfig(section: LandingSection): LandingSectionConfig | null {
    return this.configSubject.value[section];
  }

  hasCustomContent(section: LandingSection): boolean {
    return !!this.getSectionConfig(section);
  }

  saveSection(section: LandingSection, fabricJson: unknown): void {
    const nextConfig: LandingConfig = {
      ...this.configSubject.value,
      [section]: {
        fabricJson,
        updatedAt: new Date().toISOString()
      }
    };

    this.configSubject.next(nextConfig);
    this.persist(nextConfig);
  }

  resetSection(section: LandingSection): void {
    const nextConfig: LandingConfig = {
      ...this.configSubject.value,
      [section]: null
    };

    this.configSubject.next(nextConfig);
    this.persist(nextConfig);
  }

  applyRemoteConfig(config: LandingConfig): void {
    this.configSubject.next(config);
    this.persist(config);
  }

  buildUpsertRequest(storeId: string): LandingConfigUpsertRequest {
    return {
      storeId,
      config: this.configSubject.value
    };
  }

  private persist(config: LandingConfig): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(config));
  }

  private readFromStorage(): LandingConfig {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return createEmptyLandingConfig();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LandingConfig>;
      return {
        navbar: parsed.navbar ?? null,
        hero: parsed.hero ?? null,
        products: parsed.products ?? null,
        footer: parsed.footer ?? null
      };
    } catch {
      return createEmptyLandingConfig();
    }
  }
}