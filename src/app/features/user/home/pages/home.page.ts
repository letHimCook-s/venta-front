import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LandingSection } from '../../../../core/models/landing-config.model';
import {
  createDefaultLandingBodyConfig,
  isLandingBodyConfig,
  LANDING_BODY_BLOCK_TYPES,
  LandingBodyBlock,
  LandingBodyBlockType,
  LandingBodyConfig
} from '../../../../core/models/landing-body.model';
import { LandingConfigService } from '../../../../core/services/landing-config.service';
import { AuthService } from '../../../auth/services/auth.service';

interface SectionStatus {
  id: LandingSection;
  label: string;
  customized: boolean;
}

@Component({
  selector: 'app-user-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class UserHomePage implements OnInit, OnDestroy {
  sectionStatus: SectionStatus[] = [];
  bodyConfig: LandingBodyConfig = createDefaultLandingBodyConfig();
  blockTypes = LANDING_BODY_BLOCK_TYPES;
  isPickerOpen = false;
  editingBlockId: string | null = null;
  isAdminSession = false;

  private configSub?: Subscription;

  constructor(
    private readonly landingConfigService: LandingConfigService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.landingConfigService.init();
    this.isAdminSession = this.authService.isAdmin();
    this.refreshStatus();

    this.configSub = this.landingConfigService.config$.subscribe(() => {
      this.refreshStatus();
      this.loadBodyConfig();
    });

    this.loadBodyConfig();
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  trackByBlockId(_: number, block: LandingBodyBlock): string {
    return block.id;
  }

  blockCardClass(type: LandingBodyBlockType): string {
    if (type === 'image-carousel') {
      return 'bg-gradient-to-r from-blue-900 to-indigo-700 text-white';
    }

    if (type === 'brands-loop') {
      return 'bg-white text-slate-900';
    }

    if (type === 'single-image') {
      return 'bg-slate-900 text-white';
    }

    return 'bg-white text-slate-900';
  }

  blockHint(type: LandingBodyBlockType): string {
    if (type === 'product-carousel') {
      return 'Arrastra para recorrer tarjetas de productos';
    }

    if (type === 'brands-loop') {
      return 'Marcas en animacion continua';
    }

    if (type === 'single-image') {
      return 'Banner simple enfocado en una promocion';
    }

    if (type === 'offers-grid') {
      return 'Mosaico de productos en oferta';
    }

    return 'Carrusel principal del landing';
  }

  showImageUploader(type: LandingBodyBlockType): boolean {
    return type === 'single-image' || type === 'image-carousel';
  }

  togglePicker(): void {
    this.isPickerOpen = !this.isPickerOpen;
  }

  addBlock(type: LandingBodyBlockType): void {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newBlock: LandingBodyBlock = {
      id: `${type}-${suffix}`,
      type,
      title: this.defaultTitle(type),
      subtitle: this.defaultSubtitle(type),
      items: this.defaultItems(type),
      imageUrl: null,
      ctaText: this.defaultCta(type)
    };

    this.bodyConfig = {
      blocks: [...this.bodyConfig.blocks, newBlock]
    };

    this.persistBodyConfig();
    this.isPickerOpen = false;
    this.editingBlockId = newBlock.id;
  }

  removeBlock(id: string): void {
    this.bodyConfig = {
      blocks: this.bodyConfig.blocks.filter((block) => block.id !== id)
    };
    this.persistBodyConfig();
  }

  toggleBlockEditor(id: string): void {
    this.editingBlockId = this.editingBlockId === id ? null : id;
  }

  isEditingBlock(id: string): boolean {
    return this.editingBlockId === id;
  }

  updateTitle(blockId: string, value: string): void {
    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    this.updateBlock(blockId, {
      ...block,
      title: value
    });
  }

  updateSubtitle(blockId: string, value: string): void {
    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    this.updateBlock(blockId, {
      ...block,
      subtitle: value
    });
  }

  updateCta(blockId: string, value: string): void {
    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    this.updateBlock(blockId, {
      ...block,
      ctaText: value
    });
  }

  updateItemsFromText(blockId: string, value: string): void {
    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    this.updateBlock(blockId, {
      ...block,
      items: value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => !!item)
    });
  }

  itemsAsText(block: LandingBodyBlock): string {
    return block.items.join(', ');
  }

  onBlockImageUpload(blockId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
      if (!block) {
        return;
      }

      this.updateBlock(blockId, {
        ...block,
        imageUrl: result
      });
    };

    reader.readAsDataURL(file);
  }

  private refreshStatus(): void {
    this.sectionStatus = [
      {
        id: 'navbar',
        label: 'Navbar',
        customized: this.landingConfigService.hasCustomContent('navbar')
      },
      {
        id: 'hero',
        label: 'Hero / Carrusel',
        customized: this.landingConfigService.hasCustomContent('hero')
      },
      {
        id: 'products',
        label: 'Productos / Subcategorias',
        customized: this.landingConfigService.hasCustomContent('products')
      },
      {
        id: 'footer',
        label: 'Footer',
        customized: this.landingConfigService.hasCustomContent('footer')
      }
    ];
  }

  private loadBodyConfig(): void {
    const section = this.landingConfigService.getSectionConfig('products');
    const raw = section?.fabricJson;

    if (!isLandingBodyConfig(raw)) {
      this.bodyConfig = createDefaultLandingBodyConfig();
      return;
    }

    this.bodyConfig = {
      blocks: raw.blocks.map((block) => this.normalizeBlock(block))
    };
  }

  private updateBlock(blockId: string, nextBlock: LandingBodyBlock): void {
    this.bodyConfig = {
      blocks: this.bodyConfig.blocks.map((block) => (block.id === blockId ? nextBlock : block))
    };
    this.persistBodyConfig();
  }

  private persistBodyConfig(): void {
    this.landingConfigService.saveSection('products', this.bodyConfig);
    this.refreshStatus();
  }

  private defaultTitle(type: LandingBodyBlockType): string {
    if (type === 'image-carousel') {
      return 'Nuevo carrusel de imagenes';
    }

    if (type === 'product-carousel') {
      return 'Nuevo carrusel de productos';
    }

    if (type === 'brands-loop') {
      return 'Nuevo loop de marcas';
    }

    if (type === 'single-image') {
      return 'Nueva imagen principal';
    }

    return 'Nueva grilla de ofertas';
  }

  private defaultSubtitle(type: LandingBodyBlockType): string {
    if (type === 'image-carousel') {
      return 'Edita imagenes y orden para la cabecera visual.';
    }

    if (type === 'product-carousel') {
      return 'Configura productos destacados con scroll horizontal.';
    }

    if (type === 'brands-loop') {
      return 'Agrega logos de marcas para mostrarlos en bucle.';
    }

    if (type === 'single-image') {
      return 'Ideal para una promocion puntual.';
    }

    return 'Agrega tarjetas con precio y descuento.';
  }

  private defaultItems(type: LandingBodyBlockType): string[] {
    if (type === 'image-carousel') {
      return ['Slide 1', 'Slide 2', 'Slide 3'];
    }

    if (type === 'product-carousel') {
      return ['Producto 1', 'Producto 2', 'Producto 3'];
    }

    if (type === 'brands-loop') {
      return ['Marca 1', 'Marca 2', 'Marca 3', 'Marca 4'];
    }

    if (type === 'single-image') {
      return ['Banner principal'];
    }

    return ['Oferta 1', 'Oferta 2', 'Oferta 3', 'Oferta 4'];
  }

  private defaultCta(type: LandingBodyBlockType): string {
    if (type === 'image-carousel') {
      return 'Ver novedades';
    }

    if (type === 'product-carousel') {
      return 'Ver productos';
    }

    if (type === 'brands-loop') {
      return 'Ver marcas';
    }

    if (type === 'single-image') {
      return 'Comprar ahora';
    }

    return 'Ver ofertas';
  }

  private normalizeBlock(block: LandingBodyBlock): LandingBodyBlock {
    const defaultItemsByType: Record<LandingBodyBlockType, string[]> = {
      'image-carousel': ['Slide 1', 'Slide 2', 'Slide 3'],
      'product-carousel': ['Producto 1', 'Producto 2', 'Producto 3'],
      'brands-loop': ['Marca 1', 'Marca 2', 'Marca 3', 'Marca 4'],
      'single-image': ['Banner principal'],
      'offers-grid': ['Oferta 1', 'Oferta 2', 'Oferta 3', 'Oferta 4']
    };

    const defaultCtaByType: Record<LandingBodyBlockType, string> = {
      'image-carousel': 'Ver novedades',
      'product-carousel': 'Ver productos',
      'brands-loop': 'Ver marcas',
      'single-image': 'Comprar ahora',
      'offers-grid': 'Ver ofertas'
    };

    return {
      ...block,
      items: Array.isArray(block.items) ? [...block.items] : defaultItemsByType[block.type],
      imageUrl: typeof block.imageUrl === 'string' ? block.imageUrl : null,
      ctaText:
        typeof block.ctaText === 'string' && block.ctaText.trim().length > 0
          ? block.ctaText
          : defaultCtaByType[block.type]
    };
  }
}
