import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AttributeValueType
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
export class AttributesManagerComponent implements OnChanges {
  @Input() openCreateRequestId = 0;

  readonly valueTypeOptions: Array<{ value: AttributeValueType; label: string }> = [
    { value: 'text', label: 'Texto libre' },
    { value: 'number', label: 'Numerico' },
    { value: 'select', label: 'Lista de opciones' },
    { value: 'color', label: 'Color' },
    { value: 'size', label: 'Talla' }
  ];

  form: AttributeFormModel = this.getEmptyForm();
  isInspectorVisible = false;

  feedbackMessage = '';
  errorMessage = '';

  constructor(private readonly taxonomyService: CatalogTaxonomyService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const trigger = changes['openCreateRequestId'];
    if (!trigger || trigger.currentValue === trigger.previousValue) {
      return;
    }

    if (typeof trigger.currentValue === 'number' && trigger.currentValue > 0) {
      this.openCreatePanel();
    }
  }

  openCreatePanel(): void {
    this.clearMessages();
    this.form = this.getEmptyForm();
    this.isInspectorVisible = true;
  }

  closeInspector(): void {
    this.isInspectorVisible = false;
    this.form = this.getEmptyForm();
  }

  submitAttribute(): void {
    this.clearMessages();

    try {
      const saved = this.taxonomyService.upsertAttribute({
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
      this.form = {
        id: saved.id,
        name: saved.name,
        code: saved.code,
        valueType: saved.valueType,
        optionsInput: saved.options.join(', '),
        required: saved.required
      };
      this.isInspectorVisible = true;
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible guardar el atributo.';
    }
  }

  deleteAttribute(attributeId: string): void {
    this.clearMessages();
    this.taxonomyService.deleteAttribute(attributeId);
    this.feedbackMessage = 'Atributo eliminado y removido de las categorias asociadas.';

    this.closeInspector();
  }

  shouldShowOptions(): boolean {
    return this.form.valueType === 'select' || this.form.valueType === 'size';
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
