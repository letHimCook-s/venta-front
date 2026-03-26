import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  createDefaultLandingBodyConfig,
  isLandingBodyConfig,
  LANDING_BODY_BLOCK_TYPES,
  LandingBodyBlock,
  LandingBodyBlockType,
  LandingBodyConfig
} from '../../../../../../../core/models/landing-body.model';
import { LandingConfigService } from '../../../../../../../core/services/landing-config.service';
import { LandingSection } from '../../../../../../../core/models/landing-config.model';
import { LandingEditorAction } from '../../models/landing-editor.types';

@Component({
  selector: 'app-landing-body-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-body-options.component.html',
  styleUrl: './landing-body-options.component.scss'
})
export class LandingBodyOptionsComponent {
  @Input() sectionLabel = 'Cuerpo del landing';
  @Input() sectionId: LandingSection = 'products';
  @Input() imageUrl = '';

  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() action = new EventEmitter<LandingEditorAction>();

  bodyConfig: LandingBodyConfig = createDefaultLandingBodyConfig();
  blockTypes = LANDING_BODY_BLOCK_TYPES;
  isPickerOpen = false;
  editingBlockId: string | null = null;

  constructor(private readonly landingConfigService: LandingConfigService) {
    this.landingConfigService.init();
    this.loadBodyConfig();
  }

  onImageUrlChange(value: string): void {
    this.imageUrlChange.emit(value);
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
      imageUrls: [],
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

  updateBlock(blockId: string, nextBlock: LandingBodyBlock): void {
    this.bodyConfig = {
      blocks: this.bodyConfig.blocks.map((block) => (block.id === blockId ? nextBlock : block))
    };
    this.persistBodyConfig();
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

  async onBlockImageUpload(blockId: string, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) {
      return;
    }

    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const uploadedUrls = await this.readFilesAsDataUrls(files);
    if (uploadedUrls.length === 0) {
      return;
    }

    if (block.type === 'image-carousel') {
      this.updateBlock(blockId, {
        ...block,
        imageUrls: [...(block.imageUrls ?? []), ...uploadedUrls],
        imageUrl: uploadedUrls[0]
      });
    } else {
      this.updateBlock(blockId, {
        ...block,
        imageUrl: uploadedUrls[0]
      });
    }

    input.value = '';
  }

  carouselImages(block: LandingBodyBlock): string[] {
    if (block.type !== 'image-carousel') {
      return [];
    }

    const ordered = Array.isArray(block.imageUrls) ? [...block.imageUrls] : [];
    if (ordered.length > 0) {
      return ordered;
    }

    return block.imageUrl ? [block.imageUrl] : [];
  }

  moveCarouselImage(blockId: string, index: number, direction: 'up' | 'down'): void {
    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block || block.type !== 'image-carousel') {
      return;
    }

    const images = this.carouselImages(block);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    this.updateBlock(blockId, {
      ...block,
      imageUrls: reordered,
      imageUrl: reordered[0] ?? null
    });
  }

  removeCarouselImage(blockId: string, index: number): void {
    const block = this.bodyConfig.blocks.find((item) => item.id === blockId);
    if (!block || block.type !== 'image-carousel') {
      return;
    }

    const images = this.carouselImages(block);
    if (index < 0 || index >= images.length) {
      return;
    }

    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);

    this.updateBlock(blockId, {
      ...block,
      imageUrls: nextImages,
      imageUrl: nextImages[0] ?? null
    });
  }

  showImageUploader(type: LandingBodyBlockType): boolean {
    return type === 'single-image' || type === 'image-carousel';
  }

  blockHint(type: LandingBodyBlockType): string {
    if (type === 'product-carousel') {
      return 'Carrusel horizontal de productos';
    }

    if (type === 'brands-loop') {
      return 'Marcas con loop continuo';
    }

    if (type === 'single-image') {
      return 'Banner unico principal';
    }

    if (type === 'offers-grid') {
      return 'Mosaico de ofertas';
    }

    return 'Carrusel de imagenes';
  }

  resetBodyLayout(): void {
    this.bodyConfig = createDefaultLandingBodyConfig();
    this.persistBodyConfig();
  }

  trackByBlockId(_: number, block: LandingBodyBlock): string {
    return block.id;
  }

  emit(action: LandingEditorAction): void {
    this.action.emit(action);
  }

  private loadBodyConfig(): void {
    const section = this.landingConfigService.getSectionConfig(this.sectionId);
    const raw = section?.fabricJson;

    if (!isLandingBodyConfig(raw)) {
      this.bodyConfig = createDefaultLandingBodyConfig();
      return;
    }

    this.bodyConfig = {
      blocks: raw.blocks.map((block) => this.normalizeBlock(block))
    };
  }

  private normalizeBlock(block: LandingBodyBlock): LandingBodyBlock {
    return {
      ...block,
      imageUrls: Array.isArray(block.imageUrls)
        ? [...block.imageUrls]
        : block.imageUrl
          ? [block.imageUrl]
          : []
    };
  }

  private async readFilesAsDataUrls(files: File[]): Promise<string[]> {
    const results = await Promise.all(
      files.map(
        (file) =>
          new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      )
    );

    return results.filter((value): value is string => typeof value === 'string');
  }

  private persistBodyConfig(): void {
    this.landingConfigService.saveSection(this.sectionId, this.bodyConfig);
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
}