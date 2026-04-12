import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CatalogAttribute,
  FlatCategoryNode
} from '../../../catalog/categories/models/catalog-taxonomy.model';
import { CatalogTaxonomyService } from '../../../catalog/categories/services/catalog-taxonomy.service';
import {
  AdminProduct,
  ProductAttributeValue,
  ProductImageAsset,
  ProductVideoAsset,
  UpsertAdminProductInput
} from '../../models/admin-product.model';

interface ProductFormModel {
  id?: string;
  name: string;
  description: string;
  sku: string;
  price: number | null;
  stock: number | null;
  status: 'active' | 'inactive';
  categoryId: string;
  images: ProductImageAsset[];
  videos: ProductVideoAsset[];
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent {
  private readonly maxImages = 5;
  private readonly maxVideos = 1;
  private readonly normalizedImageWidth = 1200;
  private readonly normalizedImageHeight = 1200;
  private readonly normalizedImageQuality = 0.82;

  @Input() categories: FlatCategoryNode[] = [];

  @Input()
  set product(value: AdminProduct | null) {
    this.form = this.toForm(value);
    this.attributeValues = this.toAttributeValueMap(value);
    this.videoLinkDraft = '';
    this.mediaErrorMessage = '';
    this.selectedImageId = this.form.images[0]?.id ?? null;
  }

  @Output() saveRequested = new EventEmitter<UpsertAdminProductInput>();
  @Output() toggleVisibilityRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  form: ProductFormModel = this.toForm(null);
  attributeValues: Record<string, string> = {};
  videoLinkDraft = '';
  mediaErrorMessage = '';
  selectedImageId: string | null = null;

  constructor(private readonly taxonomyService: CatalogTaxonomyService) {}

  get isEditMode(): boolean {
    return !!this.form.id;
  }

  get categoryPath(): string {
    return (
      this.categories.find((item) => item.node.id === this.form.categoryId)?.path ?? ''
    );
  }

  get availableAttributes(): CatalogAttribute[] {
    if (!this.form.categoryId) {
      return [];
    }

    return this.taxonomyService.getResolvedAttributesForCategory(this.form.categoryId);
  }

  get selectedPreviewImage(): ProductImageAsset | null {
    if (!this.form.images.length) {
      return null;
    }

    if (!this.selectedImageId) {
      return this.form.images[0] ?? null;
    }

    return this.form.images.find((item) => item.id === this.selectedImageId) ?? this.form.images[0] ?? null;
  }

  get selectedPreviewIndex(): number {
    if (!this.form.images.length) {
      return 0;
    }

    if (!this.selectedImageId) {
      return 0;
    }

    const index = this.form.images.findIndex((item) => item.id === this.selectedImageId);
    return index >= 0 ? index : 0;
  }

  onCategoryChange(): void {
    const availableIds = new Set(this.availableAttributes.map((item) => item.id));
    const next: Record<string, string> = {};

    for (const key of Object.keys(this.attributeValues)) {
      if (availableIds.has(key)) {
        next[key] = this.attributeValues[key] ?? '';
      }
    }

    this.attributeValues = next;
  }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    this.mediaErrorMessage = '';

    const availableSlots = this.maxImages - this.form.images.length;
    if (availableSlots <= 0) {
      this.mediaErrorMessage = 'Solo se permiten hasta 5 imagenes por producto.';
      input.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      this.mediaErrorMessage = 'Se cargaron solo las primeras imagenes permitidas (maximo 5).';
    }

    const nextAssets = await this.readFileAssets(selectedFiles, 'image');
    const nextImages = [...this.form.images, ...nextAssets];

    this.form = {
      ...this.form,
      images: nextImages
    };

    // Cambia siempre la preview a una imagen recien subida para feedback inmediato.
    this.selectedImageId = nextAssets[0]?.id ?? nextImages[0]?.id ?? null;

    input.value = '';
  }

  removeImage(imageId: string): void {
    this.form = {
      ...this.form,
      images: this.form.images.filter((item) => item.id !== imageId)
    };

    if (this.selectedImageId === imageId) {
      this.selectedImageId = this.form.images[0]?.id ?? null;
    }
  }

  selectImagePreview(imageId: string): void {
    this.selectedImageId = imageId;
  }

  showPreviousPreviewImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const total = this.form.images.length;
    if (total <= 1) {
      return;
    }

    const current = this.selectedPreviewIndex;
    const nextIndex = (current - 1 + total) % total;
    this.selectedImageId = this.form.images[nextIndex]?.id ?? null;
  }

  showNextPreviewImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const total = this.form.images.length;
    if (total <= 1) {
      return;
    }

    const current = this.selectedPreviewIndex;
    const nextIndex = (current + 1) % total;
    this.selectedImageId = this.form.images[nextIndex]?.id ?? null;
  }

  async onVideoFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    this.mediaErrorMessage = '';

    const availableSlots = this.maxVideos - this.form.videos.length;
    if (availableSlots <= 0) {
      this.mediaErrorMessage = 'Solo se permite 1 video por producto.';
      input.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      this.mediaErrorMessage = 'Solo se cargo 1 video porque es el limite permitido.';
    }

    const uploaded = await this.readFileAssets(selectedFiles, 'video');
    const videos: ProductVideoAsset[] = uploaded.map((item) => ({
      id: item.id,
      kind: 'file',
      source: item.dataUrl,
      name: item.name
    }));

    this.form = {
      ...this.form,
      videos: [...this.form.videos, ...videos]
    };

    input.value = '';
  }

  addVideoLink(): void {
    this.mediaErrorMessage = '';

    if (this.form.videos.length >= this.maxVideos) {
      this.mediaErrorMessage = 'Solo se permite 1 video por producto.';
      return;
    }

    const clean = this.videoLinkDraft.trim();
    if (!clean) {
      return;
    }

    this.form = {
      ...this.form,
      videos: [
        ...this.form.videos,
        {
          id: this.createId('vid-link'),
          kind: 'link',
          source: clean,
          name: 'Enlace externo'
        }
      ]
    };

    this.videoLinkDraft = '';
  }

  removeVideo(videoId: string): void {
    this.form = {
      ...this.form,
      videos: this.form.videos.filter((item) => item.id !== videoId)
    };

    this.mediaErrorMessage = '';
  }

  save(): void {
    if (this.form.images.length > this.maxImages) {
      this.mediaErrorMessage = 'Solo se permiten hasta 5 imagenes por producto.';
      return;
    }

    if (this.form.videos.length > this.maxVideos) {
      this.mediaErrorMessage = 'Solo se permite 1 video por producto.';
      return;
    }

    this.saveRequested.emit(this.buildPayload());
  }

  onPriceChange(value: number | string | null): void {
    if (value === null || value === '') {
      this.form = {
        ...this.form,
        price: null
      };
      return;
    }

    this.form = {
      ...this.form,
      price: Number(value)
    };
  }

  onStockChange(value: number | string | null): void {
    if (value === null || value === '') {
      this.form = {
        ...this.form,
        stock: null
      };
      return;
    }

    this.form = {
      ...this.form,
      stock: Number(value)
    };
  }

  private buildPayload(): UpsertAdminProductInput {
    const attributeValues: ProductAttributeValue[] = this.availableAttributes
      .map((attribute) => {
        const value = (this.attributeValues[attribute.id] ?? '').trim();
        return {
          attributeId: attribute.id,
          attributeCode: attribute.code,
          attributeName: attribute.name,
          valueType: attribute.valueType,
          value
        };
      })
      .filter((item) => !!item.value);

    return {
      id: this.form.id,
      name: this.form.name,
      description: this.form.description,
      sku: this.form.sku,
      price: Number(this.form.price ?? 0),
      stock: Number(this.form.stock ?? 0),
      status: this.form.status,
      categoryId: this.form.categoryId || null,
      categoryPath: this.categoryPath,
      attributeValues,
      images: [...this.form.images],
      videos: [...this.form.videos]
    };
  }

  trackByCategory = (_index: number, item: FlatCategoryNode): string => item.node.id;
  trackByImage = (_index: number, item: ProductImageAsset): string => item.id;
  trackByVideo = (_index: number, item: ProductVideoAsset): string => item.id;
  trackByAttribute = (_index: number, item: CatalogAttribute): string => item.id;

  private toForm(product: AdminProduct | null): ProductFormModel {
    if (!product) {
      return {
        name: '',
        description: '',
        sku: '',
        price: null,
        stock: null,
        status: 'active',
        categoryId: '',
        images: [],
        videos: []
      };
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      status: product.status === 'active' ? 'active' : 'inactive',
      categoryId: product.categoryId ?? '',
      images: [...product.images],
      videos: [...product.videos]
    };
  }

  private toAttributeValueMap(product: AdminProduct | null): Record<string, string> {
    if (!product) {
      return {};
    }

    return product.attributeValues.reduce<Record<string, string>>((acc, item) => {
      acc[item.attributeId] = item.value;
      return acc;
    }, {});
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  private async readFileAssets(
    files: File[],
    kind: 'image' | 'video'
  ): Promise<Array<{ id: string; name: string; dataUrl: string }>> {
    const mapped = await Promise.all(
      files.map(async (file) => ({
        id: this.createId(kind),
        name: file.name,
        dataUrl:
          kind === 'image'
            ? await this.readImageAsNormalizedDataUrl(file)
            : await this.readFileAsDataUrl(file)
      }))
    );

    return mapped;
  }

  private async readImageAsNormalizedDataUrl(file: File): Promise<string> {
    const originalDataUrl = await this.readFileAsDataUrl(file);
    return this.resizeImageToCoverDataUrl(
      originalDataUrl,
      this.normalizedImageWidth,
      this.normalizedImageHeight,
      this.normalizedImageQuality
    );
  }

  private resizeImageToCoverDataUrl(
    sourceDataUrl: string,
    width: number,
    height: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          resolve(sourceDataUrl);
          return;
        }

        // Escala con modo cover y recorte centrado para unificar tamaño visual.
        const scale = Math.max(width / image.width, height / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;

        context.clearRect(0, 0, width, height);
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(sourceDataUrl);
        }
      };

      image.onerror = () => resolve(sourceDataUrl);
      image.src = sourceDataUrl;
    });
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
