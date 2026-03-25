export type NavbarIcon = 'user' | 'cart';

export interface NavbarConfig {
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

export interface FooterConfig {
  showSocial: boolean;
  socialTitle: string;
  socialItems: string[];
  aboutTitle: string;
  aboutLinks: string[];
  secureTitle: string;
  secureLinks: string[];
  showPayments: boolean;
  paymentsTitle: string;
  paymentMethods: string[];
  legalText: string;
  backgroundColor: string;
  textColor: string;
  dividerColor: string;
}

export const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
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

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  showSocial: true,
  socialTitle: 'Nuestras Redes Sociales',
  socialItems: ['Facebook', 'Instagram', 'X'],
  aboutTitle: 'SOBRE GIGA SHOP',
  aboutLinks: [
    'Nuestra Empresa',
    '¿Por que elegirnos?',
    'Nuestras Tiendas',
    'Trabaja con Nosotros',
    'Libros de Reclamaciones'
  ],
  secureTitle: 'COMPRA SEGURA',
  secureLinks: [
    'Nuestros Asesores',
    '¿Como comprar en la web?',
    'Condiciones de delivery',
    'Politica de devoluciones',
    'Politica de Privacidad',
    'Terminos y Condiciones'
  ],
  showPayments: true,
  paymentsTitle: 'METODOS DE PAGO',
  paymentMethods: ['VISA', 'AMEX', 'PAYPAL'],
  legalText: 'GIGA SHOP 202X - Todos los derechos reservados',
  backgroundColor: '#00184d',
  textColor: '#ffffff',
  dividerColor: '#8ea0d6'
};

export function isNavbarConfig(value: unknown): value is NavbarConfig {
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

export function isFooterConfig(value: unknown): value is FooterConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<FooterConfig>;
  return (
    typeof candidate.showSocial === 'boolean' &&
    typeof candidate.socialTitle === 'string' &&
    Array.isArray(candidate.socialItems) &&
    candidate.socialItems.every((item) => typeof item === 'string') &&
    typeof candidate.aboutTitle === 'string' &&
    Array.isArray(candidate.aboutLinks) &&
    candidate.aboutLinks.every((item) => typeof item === 'string') &&
    typeof candidate.secureTitle === 'string' &&
    Array.isArray(candidate.secureLinks) &&
    candidate.secureLinks.every((item) => typeof item === 'string') &&
    typeof candidate.showPayments === 'boolean' &&
    typeof candidate.paymentsTitle === 'string' &&
    Array.isArray(candidate.paymentMethods) &&
    candidate.paymentMethods.every((item) => typeof item === 'string') &&
    typeof candidate.legalText === 'string' &&
    typeof candidate.backgroundColor === 'string' &&
    typeof candidate.textColor === 'string' &&
    typeof candidate.dividerColor === 'string'
  );
}
