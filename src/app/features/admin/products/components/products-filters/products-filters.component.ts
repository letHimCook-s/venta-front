import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminProduct } from '../../models/admin-product.model';

export interface ProductTableFilters {
  categoryPath: string;
  attributeId: string;
  attributeValues: string[];
  attributeSelections?: Record<string, string[]>;
  priceMax?: number | null;
}

interface AttributeOption {
  id: string;
  name: string;
  valueType: string;
}

interface AttributeValueOption {
  value: string;
  label: string;
  colorHex: string | null;
}

interface SelectedAttributeChip {
  attributeId: string;
  attributeName: string;
  value: string;
  label: string;
  colorHex: string | null;
}

@Component({
  selector: 'admin-products-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-filters.component.html',
  styleUrl: './products-filters.component.scss'
})
export class ProductsFiltersComponent {
  @Input() products: AdminProduct[] = [];
  @Input() isColumnLayout = false;

  @Output() filtersChange = new EventEmitter<ProductTableFilters>();
  @Output() layoutToggleRequested = new EventEmitter<void>();

  selectedCategoryPath = '';
  selectedAttributeId = '';
  selectedAttributeValues: string[] = [];
  selectedAttributeValuesByAttribute: Record<string, string[]> = {};
  isValueMenuOpen = false;
  selectedPriceMax: number | null = null;
  constructor(private readonly hostRef: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isColumnLayout']) {
      return;
    }

    const current = changes['isColumnLayout'].currentValue as boolean;
    const previous = changes['isColumnLayout'].previousValue as boolean | undefined;

    if (current === previous) {
      return;
    }

    if (current) {
      const previousAttributeId = this.selectedAttributeId;
      const previousAttributeValues = [...this.selectedAttributeValues];

      this.selectedCategoryPath = '';
      this.selectedAttributeId = '';
      this.selectedAttributeValues = [];

      if (previousAttributeId && previousAttributeValues.length > 0) {
        this.selectedAttributeValuesByAttribute = {
          ...this.selectedAttributeValuesByAttribute,
          [previousAttributeId]: previousAttributeValues
        };
      }

      this.isValueMenuOpen = false;
    } else {
      const entries = Object.entries(this.selectedAttributeValuesByAttribute).filter(
        ([, values]) => values.length > 0
      );
      const first = entries[0];
      this.selectedAttributeId = first?.[0] ?? this.selectedAttributeId;
      this.selectedAttributeValues = first ? [...first[1]] : this.selectedAttributeValues;
    }

    this.applyFilters();
  }

  get categoryOptions(): string[] {
    const categories = new Set(
      this.products
        .map((item) => item.categoryPath.trim())
        .filter((item) => !!item)
    );

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }

  get attributeOptions(): AttributeOption[] {
    const map = new Map<string, AttributeOption>();

    for (const product of this.products) {
      for (const attribute of product.attributeValues) {
        if (!map.has(attribute.attributeId)) {
          map.set(attribute.attributeId, {
            id: attribute.attributeId,
            name: attribute.attributeName,
            valueType: attribute.valueType
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  get selectedAttributeOption(): AttributeOption | null {
    return (
      this.attributeOptions.find((item) => item.id === this.selectedAttributeId) ?? null
    );
  }

  get attributeValueOptions(): AttributeValueOption[] {
    const selectedAttribute = this.selectedAttributeId.trim();
    if (!selectedAttribute) {
      return [];
    }

    const values = new Set<string>();
    for (const product of this.products) {
      if (
        this.selectedCategoryPath &&
        product.categoryPath.trim() !== this.selectedCategoryPath.trim()
      ) {
        continue;
      }

      for (const attribute of product.attributeValues) {
        if (attribute.attributeId !== selectedAttribute) {
          continue;
        }

        const value = attribute.value.trim();
        if (value) {
          values.add(value);
        }
      }
    }

    return Array.from(values)
      .map((value) => this.toAttributeValueOption(value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  get selectedAttributeValueOption(): AttributeValueOption | null {
    if (!this.selectedAttributeValues.length) {
      return null;
    }

    return (
      this.attributeValueOptions.find((item) => item.value === this.selectedAttributeValues[0]) ??
      null
    );
  }

  get selectedAttributeValueOptions(): AttributeValueOption[] {
    const selected = new Set(this.selectedAttributeValues);
    return this.attributeValueOptions.filter((item) => selected.has(item.value));
  }

  get selectedAttributeCheckboxChips(): SelectedAttributeChip[] {
    const chips: SelectedAttributeChip[] = [];

    for (const attribute of this.attributeOptions) {
      const selectedValues = this.selectedAttributeValuesByAttribute[attribute.id] ?? [];
      if (!selectedValues.length) {
        continue;
      }

      const optionMap = new Map(
        this.getAttributeValueOptionsByAttribute(attribute.id).map((item) => [item.value, item])
      );

      for (const value of selectedValues) {
        const option = optionMap.get(value);
        chips.push({
          attributeId: attribute.id,
          attributeName: attribute.name,
          value,
          label: option?.label ?? value,
          colorHex: option?.colorHex ?? null
        });
      }
    }

    return chips;
  }

  get hasAnyAttributeCheckboxSelection(): boolean {
    return Object.values(this.selectedAttributeValuesByAttribute).some((values) => values.length > 0);
  }

  get maxAvailablePrice(): number {
    const max = this.products.reduce((acc, item) => Math.max(acc, item.price), 0);
    return Math.max(1, Math.ceil(max));
  }

  get currentPriceMax(): number {
    return this.selectedPriceMax ?? this.maxAvailablePrice;
  }

  get valueSelectorLabel(): string {
    if (!this.selectedAttributeValues.length) {
      return 'Todos los valores';
    }

    if (this.selectedAttributeValues.length === 1) {
      return this.selectedAttributeValueOption?.label ?? '1 seleccionado';
    }

    return `${this.selectedAttributeValues.length} seleccionados`;
  }

  get hasAppliedFilters(): boolean {
    const hasInlineFilters =
      !!this.selectedCategoryPath ||
      !!this.selectedAttributeId ||
      this.selectedAttributeValues.length > 0;

    const hasColumnSelections = Object.values(this.selectedAttributeValuesByAttribute).some(
      (values) => values.length > 0
    );

    return hasInlineFilters || hasColumnSelections || this.selectedPriceMax !== null;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (!this.hostRef.nativeElement.contains(target)) {
      this.isValueMenuOpen = false;
    }
  }

  onCategoryChange(): void {
    this.selectedAttributeValues = [];
    this.selectedAttributeValuesByAttribute = {};
    this.isValueMenuOpen = false;
    this.applyFilters();
  }

  onAttributeChange(): void {
    this.selectedAttributeValues = [];
    this.isValueMenuOpen = false;
    this.applyFilters();
  }

  toggleValueMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.selectedAttributeId) {
      return;
    }

    this.isValueMenuOpen = !this.isValueMenuOpen;
  }

  toggleAttributeValue(value: string): void {
    const selected = new Set(this.selectedAttributeValues);
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }

    this.selectedAttributeValues = Array.from(selected);
    this.applyFilters();
  }

  getAttributeValueOptionsByAttribute(attributeId: string): AttributeValueOption[] {
    const values = new Set<string>();

    for (const product of this.products) {
      for (const attribute of product.attributeValues) {
        if (attribute.attributeId !== attributeId) {
          continue;
        }

        const value = attribute.value.trim();
        if (!value) {
          continue;
        }

        values.add(value);
      }
    }

    const attribute = this.attributeOptions.find((item) => item.id === attributeId);
    const isColor = attribute?.valueType === 'color';

    return Array.from(values)
      .map((value) => this.toAttributeValueOptionByType(value, isColor))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  isAttributeCheckboxSelected(attributeId: string, value: string): boolean {
    const selected = this.selectedAttributeValuesByAttribute[attributeId] ?? [];
    return selected.includes(value);
  }

  toggleAttributeCheckbox(attributeId: string, value: string): void {
    const selected = new Set(this.selectedAttributeValuesByAttribute[attributeId] ?? []);
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }

    this.selectedAttributeValuesByAttribute = {
      ...this.selectedAttributeValuesByAttribute,
      [attributeId]: Array.from(selected)
    };

    this.applyFilters();
  }

  onPriceMaxChange(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      this.selectedPriceMax = null;
      this.applyFilters();
      return;
    }

    const clamped = Math.max(0, Math.min(this.maxAvailablePrice, Math.round(parsed)));
    this.selectedPriceMax = clamped >= this.maxAvailablePrice ? null : clamped;
    this.applyFilters();
  }

  clearAttributeValues(): void {
    this.selectedAttributeValues = [];
    this.applyFilters();
  }

  removeAttributeValue(value: string): void {
    this.selectedAttributeValues = this.selectedAttributeValues.filter((item) => item !== value);
    this.applyFilters();
  }

  isValueSelected(value: string): boolean {
    return this.selectedAttributeValues.includes(value);
  }

  applyFilters(): void {
    const cleanedSelections = Object.entries(this.selectedAttributeValuesByAttribute).reduce(
      (acc, [attributeId, values]) => {
        const cleanValues = values.map((item) => item.trim()).filter((item) => !!item);
        if (cleanValues.length > 0) {
          acc[attributeId] = cleanValues;
        }
        return acc;
      },
      {} as Record<string, string[]>
    );

    this.filtersChange.emit({
      categoryPath: this.isColumnLayout ? '' : this.selectedCategoryPath,
      attributeId: this.isColumnLayout ? '' : this.selectedAttributeId,
      attributeValues: this.isColumnLayout ? [] : [...this.selectedAttributeValues],
      attributeSelections: cleanedSelections,
      priceMax: this.selectedPriceMax
    });
  }

  resetFilters(): void {
    this.selectedCategoryPath = '';
    this.selectedAttributeId = '';
    this.selectedAttributeValues = [];
    this.selectedAttributeValuesByAttribute = {};
    this.selectedPriceMax = null;
    this.isValueMenuOpen = false;
    this.applyFilters();
  }

  trackByAttributeValue = (_index: number, item: AttributeValueOption): string => item.value;

  private toAttributeValueOption(value: string): AttributeValueOption {
    const isColorAttribute = this.selectedAttributeOption?.valueType === 'color';
    return this.toAttributeValueOptionByType(value, isColorAttribute);
  }

  private toAttributeValueOptionByType(
    value: string,
    isColorAttribute: boolean
  ): AttributeValueOption {
    const hex = this.normalizeColorValue(value, isColorAttribute);
    if (!hex) {
      return {
        value,
        label: value,
        colorHex: null
      };
    }

    return {
      value,
      label: `${this.getColorName(hex)} (${hex})`,
      colorHex: hex
    };
  }

  private normalizeColorValue(value: string, forceColor: boolean): string | null {
    const hex = this.normalizeHexColor(value);
    if (hex) {
      return hex;
    }

    const key = value.trim().toLowerCase();
    if (!key) {
      return null;
    }

    const namedColors: Record<string, string> = {
      rojo: '#FF0000',
      red: '#FF0000',
      azul: '#0000FF',
      blue: '#0000FF',
      verde: '#00FF00',
      green: '#00FF00',
      amarillo: '#FFFF00',
      yellow: '#FFFF00',
      naranja: '#FFA500',
      orange: '#FFA500',
      morado: '#800080',
      purple: '#800080',
      rosa: '#FFC0CB',
      pink: '#FFC0CB',
      negro: '#000000',
      black: '#000000',
      blanco: '#FFFFFF',
      white: '#FFFFFF',
      gris: '#808080',
      gray: '#808080',
      grey: '#808080',
      marron: '#A52A2A',
      marronclaro: '#CD853F',
      brown: '#A52A2A',
      cian: '#00FFFF',
      cyan: '#00FFFF'
    };

    const normalizedKey = key.replace(/\s+/g, '');
    if (namedColors[normalizedKey]) {
      return namedColors[normalizedKey];
    }

    return forceColor ? '#808080' : null;
  }

  private normalizeHexColor(value: string): string | null {
    const normalized = value.trim().toUpperCase();
    if (!normalized.startsWith('#')) {
      return null;
    }

    const shortPattern = /^#([0-9A-F]{3})$/;
    const longPattern = /^#([0-9A-F]{6})$/;

    if (shortPattern.test(normalized)) {
      const hex = normalized.slice(1);
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }

    if (longPattern.test(normalized)) {
      return normalized;
    }

    return null;
  }

  private getColorName(hex: string): string {
    const palette: Array<{ hex: string; name: string }> = [
      { hex: '#000000', name: 'Negro' },
      { hex: '#FFFFFF', name: 'Blanco' },
      { hex: '#808080', name: 'Gris' },
      { hex: '#FF0000', name: 'Rojo' },
      { hex: '#FFA500', name: 'Naranja' },
      { hex: '#FFFF00', name: 'Amarillo' },
      { hex: '#00FF00', name: 'Verde' },
      { hex: '#00FFFF', name: 'Cian' },
      { hex: '#0000FF', name: 'Azul' },
      { hex: '#800080', name: 'Morado' },
      { hex: '#FFC0CB', name: 'Rosa' },
      { hex: '#A52A2A', name: 'Marron' }
    ];

    const exact = palette.find((item) => item.hex === hex);
    if (exact) {
      return exact.name;
    }

    const target = this.hexToRgb(hex);
    if (!target) {
      return hex;
    }

    let bestName = hex;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const item of palette) {
      const rgb = this.hexToRgb(item.hex);
      if (!rgb) {
        continue;
      }

      const distance = Math.sqrt(
        (target.r - rgb.r) ** 2 + (target.g - rgb.g) ** 2 + (target.b - rgb.b) ** 2
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestName = item.name;
      }
    }

    return bestName;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const normalized = this.normalizeHexColor(hex);
    if (!normalized) {
      return null;
    }

    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16)
    };
  }
}
