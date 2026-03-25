export type LandingSection = 'navbar' | 'hero' | 'products' | 'footer';

export interface LandingSectionConfig {
  fabricJson: unknown;
  updatedAt: string;
}

export type LandingConfig = Record<LandingSection, LandingSectionConfig | null>;

export interface LandingConfigUpsertRequest {
  storeId: string;
  config: LandingConfig;
}

export function createEmptyLandingConfig(): LandingConfig {
  return {
    navbar: null,
    hero: null,
    products: null,
    footer: null
  };
}