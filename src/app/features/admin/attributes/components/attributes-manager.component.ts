import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AttributeValueType,
  CatalogAttribute,
  CatalogTaxonomyState,
  FlatCategoryNode
} from '../../categories/models/catalog-taxonomy.model';
import { CatalogTaxonomyService } from '../../categories/services/catalog-taxonomy.service';

interface AttributeFormModel {
  id?: string;
  name: string;
  code: string;
  valueType: AttributeValueType;
  optionsInput: string;
  required: boolean;
}

@Component({
  selector: 'app-attributes-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attributes-manager.component.html',
  styleUrl: './attributes-manager.component.scss'
})
export class AttributesManagerComponent implements OnInit, OnDestroy {
  readonly valueTypeOptions: Array<{ value: AttributeValueType; label: string }> = [
    { value: 'text', label: 'Texto libre' },
    { value: 'number', label: 'Numerico' },
    { value: 'select', label: 'Lista de opciones' },
    { value: 'color', label: 'Color' },
    { value: 'size', label: 'Talla' }
  ];

  form: AttributeFormModel = this.getEmptyForm();
  attributes: CatalogAttribute[] = [];
  flatCategories: FlatCategoryNode[] = [];

  feedbackMessage = '';
  errorMessage = '';

  private readonly subscription = new Subscription();

  constructor(private readonly taxonomyService: CatalogTaxonomyService) {}

  ngOnInit(): void {
    this.refreshViewModel(this.taxonomyService.getSnapshot());
    this.subscription.add(
      this.taxonomyService.state$.subscribe((state) => {
        this.refreshViewModel(state);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  submitAttribute(): void {
    this.clearMessages();

    try {
      this.taxonomyService.upsertAttribute({
        id: this.form.id,
        name: this.form.name,
        code: this.form.code,
        valueType: this.form.valueType,
        required: this.form.required,
        options: this.shouldShowOptions()
          ? this.form.optionsInput
              .split(',')
              .map((item) => item.trim())
              .filter((item) => !!item)
          : []
      });

      this.feedbackMessage = this.form.id
        ? 'Atributo actualizado correctamente.'
        : 'Atributo creado correctamente.';
      this.cancelEdit();
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible guardar el atributo.';
    }
  }

  startEdit(attribute: CatalogAttribute): void {
    this.clearMessages();
    this.form = {
      id: attribute.id,
      name: attribute.name,
      code: attribute.code,
      valueType: attribute.valueType,
      optionsInput: attribute.options.join(', '),
      required: attribute.required
    };
  }

  cancelEdit(): void {
    this.form = this.getEmptyForm();
  }

  deleteAttribute(attributeId: string): void {
    this.clearMessages();
    this.taxonomyService.deleteAttribute(attributeId);
    this.feedbackMessage = 'Atributo eliminado y removido de las categorias asociadas.';

    if (this.form.id === attributeId) {
      this.cancelEdit();
    }
  }

  shouldShowOptions(): boolean {
    return this.form.valueType === 'select' || this.form.valueType === 'size';
  }

  getCategoryPaths(attributeId: string): string {
    const paths = this.flatCategories
      .filter((item) => item.node.attributeIds.includes(attributeId))
      .map((item) => item.path);

    return paths.length ? paths.join(' | ') : '-';
  }

  getUsage(attributeId: string): number {
    return this.taxonomyService.getAttributeUsage(attributeId);
  }

  trackByAttributeId(_: number, item: CatalogAttribute): string {
    return item.id;
  }

  private refreshViewModel(state: CatalogTaxonomyState): void {
    this.attributes = state.attributes.slice().sort((a, b) => a.name.localeCompare(b.name));
    this.flatCategories = this.taxonomyService.getFlatCategories();
  }

  private getEmptyForm(): AttributeFormModel {
    return {
      name: '',
      code: '',
      valueType: 'text',
      optionsInput: '',
      required: false
    };
  }

  private clearMessages(): void {
    this.feedbackMessage = '';
    this.errorMessage = '';
  }
}
