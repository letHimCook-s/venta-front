export type LandingBodyBlockType =
  | 'image-carousel'
  | 'product-carousel'
  | 'brands-loop'
  | 'single-image'
  | 'offers-grid';

export interface LandingBodyBlock {
  id: string;
  type: LandingBodyBlockType;
  title: string;
  subtitle: string;
  items: string[];
  imageUrl: string | null;
  imageUrls?: string[];
  ctaText: string;
}

export interface LandingBodyConfig {
  blocks: LandingBodyBlock[];
}

export const LANDING_BODY_BLOCK_TYPES: Array<{ id: LandingBodyBlockType; label: string }> = [
  { id: 'image-carousel', label: 'Carrusel de imagenes' },
  { id: 'product-carousel', label: 'Carrusel de productos' },
  { id: 'brands-loop', label: 'Carrusel de marcas en bucle' },
  { id: 'single-image', label: 'Una sola imagen' },
  { id: 'offers-grid', label: 'Grid de ofertas' }
];

export function createDefaultLandingBodyConfig(): LandingBodyConfig {
  return {
    blocks: [
      {
        id: 'default-image-carousel',
        type: 'image-carousel',
        title: 'Juega, trabaja y crea sin limites',
        subtitle: 'Banner principal con CTA y visual destacado.',
        items: ['Slide principal', 'Slide promociones', 'Slide novedades'],
        imageUrl: null,
        imageUrls: [],
        ctaText: 'Comprar ahora'
      },
      {
        id: 'default-brands-loop',
        type: 'brands-loop',
        title: 'Nuestras marcas nos respaldan',
        subtitle: 'Cinta continua de marcas destacadas.',
        items: ['Razer', 'Corsair', 'Redragon', 'HyperX', 'Logitech'],
        imageUrl: null,
        imageUrls: [],
        ctaText: 'Ver marcas'
      },
      {
        id: 'default-product-carousel',
        type: 'product-carousel',
        title: 'Destacados para gaming',
        subtitle: 'Tarjetas de productos con desplazamiento horizontal.',
        items: ['Audifono Pro X', 'Mouse RGB', 'Teclado Mecanico', 'Laptop Gamer'],
        imageUrl: null,
        imageUrls: [],
        ctaText: 'Explorar catalogo'
      },
      {
        id: 'default-offers-grid',
        type: 'offers-grid',
        title: 'Ofertas',
        subtitle: 'Grilla de productos en promocion.',
        items: ['Oferta Laptop', 'Oferta Monitor', 'Oferta Setup RGB', 'Oferta Combo Gamer'],
        imageUrl: null,
        imageUrls: [],
        ctaText: 'Ver ofertas'
      }
    ]
  };
}

export function isLandingBodyConfig(value: unknown): value is LandingBodyConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LandingBodyConfig>;
  return (
    Array.isArray(candidate.blocks) &&
    candidate.blocks.every(
      (block) =>
        !!block &&
        typeof block === 'object' &&
        typeof (block as Partial<LandingBodyBlock>).id === 'string' &&
        typeof (block as Partial<LandingBodyBlock>).title === 'string' &&
        typeof (block as Partial<LandingBodyBlock>).subtitle === 'string' &&
        Array.isArray((block as Partial<LandingBodyBlock>).items) &&
        ((block as Partial<LandingBodyBlock>).items ?? []).every((item) => typeof item === 'string') &&
        (typeof (block as Partial<LandingBodyBlock>).imageUrl === 'string' ||
          (block as Partial<LandingBodyBlock>).imageUrl === null) &&
        ((block as Partial<LandingBodyBlock>).imageUrls === undefined ||
          (Array.isArray((block as Partial<LandingBodyBlock>).imageUrls) &&
            ((block as Partial<LandingBodyBlock>).imageUrls ?? []).every(
              (imageUrl) => typeof imageUrl === 'string'
            ))) &&
        typeof (block as Partial<LandingBodyBlock>).ctaText === 'string' &&
        isLandingBodyBlockType((block as Partial<LandingBodyBlock>).type)
    )
  );
}

function isLandingBodyBlockType(value: unknown): value is LandingBodyBlockType {
  return (
    value === 'image-carousel' ||
    value === 'product-carousel' ||
    value === 'brands-loop' ||
    value === 'single-image' ||
    value === 'offers-grid'
  );
}
