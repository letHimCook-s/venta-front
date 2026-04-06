import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CatalogAttribute,
  CatalogTaxonomyState,
  CategoryNode,
  FlatCategoryNode
} from '../models/catalog-taxonomy.model';
import { CatalogTaxonomyService } from '../services/catalog-taxonomy.service';

interface CategoryFormModel {
  id?: string;
  name: string;
  parentId: string;
  attributeIds: string[];
}

type TreeFilterMode = 'all' | 'categories' | 'attributes';

interface TreeDisplayRow {
  key: string;
  kind: 'category' | 'attribute';
  level: number;
  category: FlatCategoryNode;
  attribute?: CatalogAttribute;
}

type TreeDragPayload =
  | { kind: 'category'; categoryId: string }
  | { kind: 'attribute'; attributeId: string; fromCategoryId: string };

@Component({
  selector: 'app-categories-table',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './categories-table.component.html',
  styleUrl: './categories-table.component.scss'
})
export class CategoriesTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() createCategoryRequestId = 0;

  form: CategoryFormModel = this.getEmptyForm();
  flatCategories: FlatCategoryNode[] = [];
  attributes: CatalogAttribute[] = [];

  compactMode = false;
  isInspectorVisible = false;
  treeFilterMode: TreeFilterMode = 'all';

  selectedCategoryId = '';
  selectedCategoryPath = '';
  selectedAttributeRowKey = '';
  selectedDirectAttributes: CatalogAttribute[] = [];
  selectedResolvedAttributes: CatalogAttribute[] = [];

  currentDrag: TreeDragPayload | null = null;
  dragOverCategoryId = '';
  isRootDropActive = false;

  collapsedNodeIds = new Set<string>();

  feedbackMessage = '';
  errorMessage = '';

  private readonly subscription = new Subscription();
  private categoryMap = new Map<string, CategoryNode>();
  private attributeMap = new Map<string, CatalogAttribute>();

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

  ngOnChanges(changes: SimpleChanges): void {
    const trigger = changes['createCategoryRequestId'];
    if (!trigger || trigger.currentValue === trigger.previousValue) {
      return;
    }

    if (typeof trigger.currentValue === 'number' && trigger.currentValue > 0) {
      this.startCreateRoot();
    }
  }

  get visibleFlatCategories(): FlatCategoryNode[] {
    return this.flatCategories.filter((item) => this.isVisibleInTree(item.node));
  }

  get treeRows(): TreeDisplayRow[] {
    const rows: TreeDisplayRow[] = [];

    for (const flatCategory of this.visibleFlatCategories) {
      const directAttributes = this.getDirectAttributesForCategory(flatCategory.node);

      const includeCategoryRow =
        this.treeFilterMode !== 'attributes' || directAttributes.length > 0;

      if (includeCategoryRow) {
        rows.push({
          key: `cat-${flatCategory.node.id}`,
          kind: 'category',
          level: flatCategory.level,
          category: flatCategory
        });
      }

      if (this.treeFilterMode === 'categories') {
        continue;
      }

      for (const attribute of directAttributes) {
        rows.push({
          key: `attr-${flatCategory.node.id}-${attribute.id}`,
          kind: 'attribute',
          level: flatCategory.level + 1,
          category: flatCategory,
          attribute
        });
      }
    }

    return rows;
  }

  get treeEmptyMessage(): string {
    if (this.treeFilterMode === 'attributes') {
      return 'No hay atributos directos asignados en las categorias visibles.';
    }

    if (this.treeFilterMode === 'categories') {
      return 'No hay categorias visibles con el estado actual del arbol.';
    }

    return 'No hay elementos para mostrar en el arbol.';
  }

  get selectedCategory(): FlatCategoryNode | null {
    return (
      this.flatCategories.find((item) => item.node.id === this.selectedCategoryId) ?? null
    );
  }

  get parentOptions(): FlatCategoryNode[] {
    if (!this.form.id) {
      return this.flatCategories;
    }

    const blocked = new Set([
      this.form.id,
      ...this.taxonomyService.getDescendantIds(this.form.id)
    ]);

    return this.flatCategories.filter((item) => !blocked.has(item.node.id));
  }

  submitCategory(): void {
    this.clearMessages();

    try {
      const saved = this.taxonomyService.upsertCategory({
        id: this.form.id,
        name: this.form.name,
        parentId: this.form.parentId || null,
        attributeIds: [...this.form.attributeIds]
      });

      this.feedbackMessage = this.form.id
        ? 'Categoria actualizada correctamente.'
        : 'Categoria creada correctamente.';
      this.selectCategoryById(saved.id);
      this.cancelEdit();
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible guardar la categoria.';
    }
  }

  startEditCategory(item: FlatCategoryNode): void {
    this.clearMessages();
    this.selectedAttributeRowKey = '';
    this.selectCategoryById(item.node.id);
    this.form = this.buildFormFromCategory(item.node);
    this.openInspector();
  }

  startNewWithParent(parentId: string): void {
    this.clearMessages();
    this.selectedAttributeRowKey = '';
    this.openInspector();
    this.form = {
      ...this.getEmptyForm(),
      parentId
    };
  }

  startCreateRoot(): void {
    this.clearMessages();
    this.selectedAttributeRowKey = '';
    this.openInspector();
    this.form = this.getEmptyForm();
  }

  closeInspector(): void {
    this.isInspectorVisible = false;
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.form = this.getEmptyForm();
  }

  deleteCategory(categoryId: string): void {
    this.clearMessages();
    const descendantsCount = this.taxonomyService.getDescendantIds(categoryId).length;

    this.taxonomyService.deleteCategory(categoryId);
    this.feedbackMessage =
      descendantsCount > 0
        ? 'Categoria eliminada junto con sus subcategorias.'
        : 'Categoria eliminada correctamente.';

    if (this.form.id === categoryId) {
      this.cancelEdit();
    }

    if (this.selectedCategoryId === categoryId) {
      this.clearSelection();
    }

    this.collapsedNodeIds.delete(categoryId);
  }

  toggleAttribute(attributeId: string, checked: boolean): void {
    if (checked) {
      if (!this.form.attributeIds.includes(attributeId)) {
        this.form = {
          ...this.form,
          attributeIds: [...this.form.attributeIds, attributeId]
        };
      }
      return;
    }

    this.form = {
      ...this.form,
      attributeIds: this.form.attributeIds.filter((item) => item !== attributeId)
    };
  }

  selectCategory(item: FlatCategoryNode): void {
    this.clearMessages();
    this.selectedAttributeRowKey = '';
    this.selectCategoryById(item.node.id);
    this.form = this.buildFormFromCategory(item.node);
    this.openInspector();
  }

  selectAttributeRow(row: TreeDisplayRow): void {
    if (!row.attribute) {
      return;
    }

    this.clearMessages();
    this.selectedAttributeRowKey = row.key;
    this.selectCategoryById(row.category.node.id);
    this.form = this.buildFormFromCategory(row.category.node);
    this.openInspector();
  }

  setTreeFilter(mode: TreeFilterMode): void {
    this.treeFilterMode = mode;
    this.selectedAttributeRowKey = '';
  }

  onRowDragStart(row: TreeDisplayRow, event: DragEvent): void {
    if (!event.dataTransfer) {
      return;
    }

    if (row.kind === 'category') {
      this.currentDrag = {
        kind: 'category',
        categoryId: row.category.node.id
      };
    } else if (row.attribute) {
      this.currentDrag = {
        kind: 'attribute',
        attributeId: row.attribute.id,
        fromCategoryId: row.category.node.id
      };
    } else {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', row.key);
    this.feedbackMessage = '';
    this.errorMessage = '';
  }

  onRowDragEnd(): void {
    this.resetDragState();
  }

  onCategoryDragOver(targetCategoryId: string, event: DragEvent): void {
    if (!this.canDropOnCategory(targetCategoryId)) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.dragOverCategoryId = targetCategoryId;
    this.isRootDropActive = false;
  }

  onCategoryDrop(targetCategoryId: string, event: DragEvent): void {
    event.preventDefault();

    if (!this.currentDrag || !this.canDropOnCategory(targetCategoryId)) {
      this.resetDragState();
      return;
    }

    this.clearMessages();

    try {
      if (this.currentDrag.kind === 'category') {
        this.taxonomyService.moveCategory(this.currentDrag.categoryId, targetCategoryId);
        this.feedbackMessage = 'Categoria movida correctamente.';
        this.selectCategoryById(this.currentDrag.categoryId);
      } else {
        this.taxonomyService.moveAttribute(
          this.currentDrag.attributeId,
          this.currentDrag.fromCategoryId,
          targetCategoryId
        );
        this.feedbackMessage = 'Atributo movido correctamente.';
        this.selectCategoryById(targetCategoryId);
      }
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible completar el movimiento.';
    }

    this.resetDragState();
  }

  onRootDragOver(event: DragEvent): void {
    if (!this.currentDrag || this.currentDrag.kind !== 'category') {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.isRootDropActive = true;
    this.dragOverCategoryId = '';
  }

  onRootDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.currentDrag || this.currentDrag.kind !== 'category') {
      this.resetDragState();
      return;
    }

    this.clearMessages();

    try {
      this.taxonomyService.moveCategory(this.currentDrag.categoryId, null);
      this.feedbackMessage = 'Categoria movida a nivel raiz correctamente.';
      this.selectCategoryById(this.currentDrag.categoryId);
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible mover la categoria.';
    }

    this.resetDragState();
  }

  onRootDragLeave(event: DragEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget) {
      return;
    }

    this.isRootDropActive = false;
  }

  isCategoryRowActive(row: TreeDisplayRow): boolean {
    return (
      row.kind === 'category' &&
      row.category.node.id === this.selectedCategoryId &&
      !this.selectedAttributeRowKey
    );
  }

  isAttributeRowActive(row: TreeDisplayRow): boolean {
    return row.kind === 'attribute' && row.key === this.selectedAttributeRowKey;
  }

  isCategoryDropTarget(row: TreeDisplayRow): boolean {
    return row.category.node.id === this.dragOverCategoryId;
  }

  isRowBeingDragged(row: TreeDisplayRow): boolean {
    if (!this.currentDrag) {
      return false;
    }

    if (row.kind === 'category' && this.currentDrag.kind === 'category') {
      return row.category.node.id === this.currentDrag.categoryId;
    }

    if (row.kind === 'attribute' && this.currentDrag.kind === 'attribute' && row.attribute) {
      return (
        row.attribute.id === this.currentDrag.attributeId &&
        row.category.node.id === this.currentDrag.fromCategoryId
      );
    }

    return false;
  }

  toggleNode(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();

    if (this.collapsedNodeIds.has(nodeId)) {
      this.collapsedNodeIds.delete(nodeId);
      return;
    }

    this.collapsedNodeIds.add(nodeId);
  }

  hasChildren(node: CategoryNode): boolean {
    return node.childrenIds.length > 0;
  }

  isNodeCollapsed(nodeId: string): boolean {
    return this.collapsedNodeIds.has(nodeId);
  }

  expandAllNodes(): void {
    this.collapsedNodeIds.clear();
  }

  collapseTree(): void {
    const collapsed = this.flatCategories
      .filter((item) => item.node.childrenIds.length > 0)
      .map((item) => item.node.id);

    this.collapsedNodeIds = new Set(collapsed);
  }

  toggleCompactMode(): void {
    this.compactMode = !this.compactMode;
  }

  getAttributeTag(attribute: CatalogAttribute): string {
    const optionPart = attribute.options.length ? ` (${attribute.options.join(', ')})` : '';
    const requiredPart = attribute.required ? ' *' : '';
    return `${attribute.name} [${attribute.code}]${optionPart}${requiredPart}`;
  }

  trackByCategoryId(_: number, item: FlatCategoryNode): string {
    return item.node.id;
  }

  trackByAttributeId(_: number, item: CatalogAttribute): string {
    return item.id;
  }

  private refreshViewModel(state: CatalogTaxonomyState): void {
    this.attributes = state.attributes.slice().sort((a, b) => a.name.localeCompare(b.name));
    this.attributeMap = new Map(this.attributes.map((item) => [item.id, item]));
    this.flatCategories = this.taxonomyService.getFlatCategories();
    this.categoryMap = new Map(this.flatCategories.map((item) => [item.node.id, item.node]));

    if (!this.selectedCategoryId) {
      return;
    }

    const selected = this.flatCategories.find(
      (item) => item.node.id === this.selectedCategoryId
    );

    if (!selected) {
      this.clearSelection();
      return;
    }

    this.applySelectionData(selected);
  }

  private getEmptyForm(): CategoryFormModel {
    return {
      name: '',
      parentId: '',
      attributeIds: []
    };
  }

  private selectCategoryById(categoryId: string): void {
    const selected = this.flatCategories.find((item) => item.node.id === categoryId);
    if (!selected) {
      this.clearSelection();
      return;
    }

    this.applySelectionData(selected);
  }

  private buildFormFromCategory(category: CategoryNode): CategoryFormModel {
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId ?? '',
      attributeIds: [...category.attributeIds]
    };
  }

  private openInspector(): void {
    this.isInspectorVisible = true;
  }

  private applySelectionData(selected: FlatCategoryNode): void {
    this.selectedCategoryId = selected.node.id;
    this.selectedCategoryPath = selected.path;

    if (this.form.id === selected.node.id) {
      this.form = this.buildFormFromCategory(selected.node);
    }

    this.selectedDirectAttributes = selected.node.attributeIds
      .map((attributeId) => this.attributeMap.get(attributeId))
      .filter((attribute): attribute is CatalogAttribute => !!attribute)
      .sort((a, b) => a.name.localeCompare(b.name));

    this.selectedResolvedAttributes = this.taxonomyService
      .getResolvedAttributesForCategory(selected.node.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private clearSelection(): void {
    this.selectedCategoryId = '';
    this.selectedCategoryPath = '';
    this.selectedAttributeRowKey = '';
    this.selectedDirectAttributes = [];
    this.selectedResolvedAttributes = [];
  }

  private getDirectAttributesForCategory(category: CategoryNode): CatalogAttribute[] {
    return category.attributeIds
      .map((attributeId) => this.attributeMap.get(attributeId))
      .filter((attribute): attribute is CatalogAttribute => !!attribute);
  }

  private isVisibleInTree(node: CategoryNode): boolean {
    let cursorParentId = node.parentId;

    while (cursorParentId) {
      if (this.collapsedNodeIds.has(cursorParentId)) {
        return false;
      }

      cursorParentId = this.categoryMap.get(cursorParentId)?.parentId ?? null;
    }

    return true;
  }

  private clearMessages(): void {
    this.feedbackMessage = '';
    this.errorMessage = '';
  }

  private canDropOnCategory(targetCategoryId: string): boolean {
    if (!this.currentDrag) {
      return false;
    }

    if (this.currentDrag.kind === 'category') {
      if (this.currentDrag.categoryId === targetCategoryId) {
        return false;
      }

      const descendants = this.taxonomyService.getDescendantIds(this.currentDrag.categoryId);
      return !descendants.includes(targetCategoryId);
    }

    if (this.currentDrag.fromCategoryId === targetCategoryId) {
      return false;
    }

    const target = this.flatCategories.find((item) => item.node.id === targetCategoryId)?.node;
    if (!target) {
      return false;
    }

    return !target.attributeIds.includes(this.currentDrag.attributeId);
  }

  private resetDragState(): void {
    this.currentDrag = null;
    this.dragOverCategoryId = '';
    this.isRootDropActive = false;
  }
}
