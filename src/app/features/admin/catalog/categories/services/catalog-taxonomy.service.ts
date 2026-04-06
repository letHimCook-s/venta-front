import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
  CatalogAttribute,
  CatalogTaxonomyState,
  CategoryNode,
  FlatCategoryNode,
  UpsertAttributeInput,
  UpsertCategoryInput
} from '../models/catalog-taxonomy.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogTaxonomyService {
  private readonly storageKey = 'admin:catalog-taxonomy:v1';
  private readonly isBrowser: boolean;

  private readonly stateSubject = new BehaviorSubject<CatalogTaxonomyState>(
    this.buildSeedState()
  );
  readonly state$ = this.stateSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (!this.isBrowser) {
      return;
    }

    const storedState = this.loadState();
    if (storedState) {
      this.stateSubject.next(storedState);
      return;
    }

    this.persistState(this.stateSubject.value);
  }

  getSnapshot(): CatalogTaxonomyState {
    return this.stateSubject.value;
  }

  getFlatCategories(): FlatCategoryNode[] {
    const state = this.stateSubject.value;
    const categoryMap = this.toCategoryMap(state.categories);
    const roots = state.categories
      .filter((item) => !item.parentId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    const output: FlatCategoryNode[] = [];

    const walk = (node: CategoryNode, level: number, ancestry: string[]): void => {
      const nextPath = [...ancestry, node.name];
      output.push({
        node,
        level,
        path: nextPath.join(' / ')
      });

      const children = node.childrenIds
        .map((childId) => categoryMap.get(childId))
        .filter((child): child is CategoryNode => !!child)
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const child of children) {
        walk(child, level + 1, nextPath);
      }
    };

    for (const root of roots) {
      walk(root, 0, []);
    }

    return output;
  }

  getResolvedAttributesForCategory(categoryId: string): CatalogAttribute[] {
    const state = this.stateSubject.value;
    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) {
      return [];
    }

    const categoryMap = this.toCategoryMap(state.categories);
    const attributeMap = this.toAttributeMap(state.attributes);
    const lineage = this.getCategoryLineage(category.id, categoryMap);
    const resolvedIds: string[] = [];

    for (const item of lineage) {
      for (const attributeId of item.attributeIds) {
        if (!resolvedIds.includes(attributeId)) {
          resolvedIds.push(attributeId);
        }
      }
    }

    return resolvedIds
      .map((attributeId) => attributeMap.get(attributeId))
      .filter((attribute): attribute is CatalogAttribute => !!attribute);
  }

  getDescendantIds(categoryId: string): string[] {
    const state = this.stateSubject.value;
    const categoryMap = this.toCategoryMap(state.categories);
    const root = categoryMap.get(categoryId);
    if (!root) {
      return [];
    }

    const descendants: string[] = [];

    // DFS over the tree to detect invalid parent selections and recursive deletes.
    const walk = (node: CategoryNode): void => {
      for (const childId of node.childrenIds) {
        const child = categoryMap.get(childId);
        if (!child) {
          continue;
        }

        descendants.push(child.id);
        walk(child);
      }
    };

    walk(root);
    return descendants;
  }

  getAttributeUsage(attributeId: string): number {
    const state = this.stateSubject.value;
    return state.categories.filter((item) => item.attributeIds.includes(attributeId)).length;
  }

  upsertAttribute(input: UpsertAttributeInput): CatalogAttribute {
    const state = this.stateSubject.value;
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error('El nombre del atributo es obligatorio.');
    }

    const rawCode = (input.code ?? cleanName).trim();
    const cleanCode = this.slugify(rawCode);
    if (!cleanCode) {
      throw new Error('El codigo del atributo no es valido.');
    }

    const existsWithSameCode = state.attributes.some(
      (item) => item.code === cleanCode && item.id !== input.id
    );
    if (existsWithSameCode) {
      throw new Error('Ya existe un atributo con ese codigo.');
    }

    const normalizedOptions = (input.options ?? [])
      .map((item) => item.trim())
      .filter((item) => !!item);

    const normalizedAttribute: CatalogAttribute = {
      id: input.id ?? this.createId('attr'),
      name: cleanName,
      code: cleanCode,
      valueType: input.valueType,
      options: input.valueType === 'select' || input.valueType === 'size' ? this.unique(normalizedOptions) : [],
      required: input.required
    };

    const hasId = !!input.id;
    const nextAttributes = hasId
      ? state.attributes.map((item) => (item.id === input.id ? normalizedAttribute : item))
      : [...state.attributes, normalizedAttribute];

    this.commitState({
      ...state,
      attributes: nextAttributes,
      updatedAt: new Date().toISOString()
    });

    return normalizedAttribute;
  }

  deleteAttribute(attributeId: string): void {
    const state = this.stateSubject.value;
    const nextAttributes = state.attributes.filter((item) => item.id !== attributeId);

    if (nextAttributes.length === state.attributes.length) {
      return;
    }

    const nextCategories = state.categories.map((item) => ({
      ...item,
      attributeIds: item.attributeIds.filter((itemId) => itemId !== attributeId)
    }));

    this.commitState({
      ...state,
      attributes: nextAttributes,
      categories: nextCategories,
      updatedAt: new Date().toISOString()
    });
  }

  upsertCategory(input: UpsertCategoryInput): CategoryNode {
    const state = this.stateSubject.value;
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error('El nombre de la categoria es obligatorio.');
    }

    const hasId = !!input.id;
    const current = hasId
      ? state.categories.find((item) => item.id === input.id)
      : undefined;

    if (hasId && !current) {
      throw new Error('No se encontro la categoria que intentas editar.');
    }

    const parentId = input.parentId?.trim() ? input.parentId : null;
    if (parentId) {
      const parentExists = state.categories.some((item) => item.id === parentId);
      if (!parentExists) {
        throw new Error('La categoria padre seleccionada no existe.');
      }
    }

    if (current && parentId) {
      const descendants = this.getDescendantIds(current.id);
      if (descendants.includes(parentId)) {
        throw new Error('No puedes asignar como padre una subcategoria de la categoria actual.');
      }
    }

    const attributeIds = this.unique(input.attributeIds).filter((attributeId) =>
      state.attributes.some((attribute) => attribute.id === attributeId)
    );

    const normalizedCategory: CategoryNode = {
      id: current?.id ?? this.createId('cat'),
      name: cleanName,
      slug: this.slugify(cleanName),
      parentId,
      childrenIds: current ? [...current.childrenIds] : [],
      attributeIds
    };

    const withUpdatedCategory = current
      ? state.categories.map((item) =>
          item.id === current.id ? normalizedCategory : item
        )
      : [...state.categories, normalizedCategory];

    const rebuiltCategories = this.rebuildTreeLinks(withUpdatedCategory);

    this.commitState({
      ...state,
      categories: rebuiltCategories,
      updatedAt: new Date().toISOString()
    });

    return normalizedCategory;
  }

  deleteCategory(categoryId: string): void {
    const state = this.stateSubject.value;
    const target = state.categories.find((item) => item.id === categoryId);
    if (!target) {
      return;
    }

    const descendantIds = this.getDescendantIds(target.id);
    const blockedIds = new Set([target.id, ...descendantIds]);

    const surviving = state.categories.filter((item) => !blockedIds.has(item.id));
    const rebuilt = this.rebuildTreeLinks(surviving);

    this.commitState({
      ...state,
      categories: rebuilt,
      updatedAt: new Date().toISOString()
    });
  }

  moveCategory(categoryId: string, newParentId: string | null): void {
    const state = this.stateSubject.value;
    const movingCategory = state.categories.find((item) => item.id === categoryId);

    if (!movingCategory) {
      throw new Error('La categoria a mover no existe.');
    }

    const cleanParentId = newParentId?.trim() ? newParentId : null;

    if (cleanParentId === movingCategory.id) {
      throw new Error('Una categoria no puede ser su propio padre.');
    }

    if (cleanParentId) {
      const parentExists = state.categories.some((item) => item.id === cleanParentId);
      if (!parentExists) {
        throw new Error('La categoria destino no existe.');
      }

      const descendants = this.getDescendantIds(movingCategory.id);
      if (descendants.includes(cleanParentId)) {
        throw new Error('No puedes mover una categoria dentro de una subcategoria propia.');
      }
    }

    if (movingCategory.parentId === cleanParentId) {
      return;
    }

    const nextCategories = state.categories.map((item) =>
      item.id === movingCategory.id
        ? {
            ...item,
            parentId: cleanParentId
          }
        : item
    );

    this.commitState({
      ...state,
      categories: this.rebuildTreeLinks(nextCategories),
      updatedAt: new Date().toISOString()
    });
  }

  moveAttribute(attributeId: string, fromCategoryId: string, toCategoryId: string): void {
    if (fromCategoryId === toCategoryId) {
      return;
    }

    const state = this.stateSubject.value;
    const sourceCategory = state.categories.find((item) => item.id === fromCategoryId);
    const targetCategory = state.categories.find((item) => item.id === toCategoryId);
    const attributeExists = state.attributes.some((item) => item.id === attributeId);

    if (!attributeExists) {
      throw new Error('El atributo seleccionado no existe.');
    }

    if (!sourceCategory || !targetCategory) {
      throw new Error('No se encontro la categoria de origen o destino.');
    }

    const nextCategories = state.categories.map((item) => {
      if (item.id === fromCategoryId) {
        return {
          ...item,
          attributeIds: item.attributeIds.filter((itemId) => itemId !== attributeId)
        };
      }

      if (item.id === toCategoryId) {
        return {
          ...item,
          attributeIds: item.attributeIds.includes(attributeId)
            ? item.attributeIds
            : [...item.attributeIds, attributeId]
        };
      }

      return item;
    });

    this.commitState({
      ...state,
      categories: nextCategories,
      updatedAt: new Date().toISOString()
    });
  }

  private buildSeedState(): CatalogTaxonomyState {
    const attributes: CatalogAttribute[] = [
      {
        id: 'attr-size',
        name: 'Talla',
        code: 'talla',
        valueType: 'size',
        options: ['S', 'M', 'L', 'XL'],
        required: true
      },
      {
        id: 'attr-color',
        name: 'Color',
        code: 'color',
        valueType: 'color',
        options: [],
        required: true
      },
      {
        id: 'attr-model',
        name: 'Modelo',
        code: 'modelo',
        valueType: 'text',
        options: [],
        required: false
      }
    ];

    const categories: CategoryNode[] = [
      {
        id: 'cat-catalogo',
        name: 'Catalogo',
        slug: 'catalogo',
        parentId: null,
        childrenIds: ['cat-hombre', 'cat-mujer'],
        attributeIds: []
      },
      {
        id: 'cat-hombre',
        name: 'Hombre',
        slug: 'hombre',
        parentId: 'cat-catalogo',
        childrenIds: ['cat-pantalon-hombre'],
        attributeIds: []
      },
      {
        id: 'cat-mujer',
        name: 'Mujer',
        slug: 'mujer',
        parentId: 'cat-catalogo',
        childrenIds: [],
        attributeIds: []
      },
      {
        id: 'cat-pantalon-hombre',
        name: 'Pantalon',
        slug: 'pantalon',
        parentId: 'cat-hombre',
        childrenIds: [],
        attributeIds: ['attr-size', 'attr-color', 'attr-model']
      }
    ];

    return {
      categories,
      attributes,
      updatedAt: new Date().toISOString()
    };
  }

  private toCategoryMap(categories: CategoryNode[]): Map<string, CategoryNode> {
    return new Map(categories.map((item) => [item.id, item]));
  }

  private toAttributeMap(attributes: CatalogAttribute[]): Map<string, CatalogAttribute> {
    return new Map(attributes.map((item) => [item.id, item]));
  }

  private getCategoryLineage(
    categoryId: string,
    categoryMap: Map<string, CategoryNode>
  ): CategoryNode[] {
    const lineage: CategoryNode[] = [];
    let cursor = categoryMap.get(categoryId);

    while (cursor) {
      lineage.push(cursor);
      cursor = cursor.parentId ? categoryMap.get(cursor.parentId) : undefined;
    }

    return lineage.reverse();
  }

  private rebuildTreeLinks(categories: CategoryNode[]): CategoryNode[] {
    const clean = categories.map((item) => ({
      ...item,
      childrenIds: []
    }));
    const map = this.toCategoryMap(clean);

    for (const category of clean) {
      if (!category.parentId) {
        continue;
      }

      const parent = map.get(category.parentId);
      if (!parent) {
        category.parentId = null;
        continue;
      }

      if (!parent.childrenIds.includes(category.id)) {
        parent.childrenIds.push(category.id);
      }
    }

    return clean;
  }

  private commitState(nextState: CatalogTaxonomyState): void {
    this.stateSubject.next(nextState);
    this.persistState(nextState);
  }

  private persistState(state: CatalogTaxonomyState): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  private loadState(): CatalogTaxonomyState | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<CatalogTaxonomyState>;
      if (!parsed || !Array.isArray(parsed.attributes) || !Array.isArray(parsed.categories)) {
        return null;
      }

      return {
        attributes: parsed.attributes as CatalogAttribute[],
        categories: this.rebuildTreeLinks(parsed.categories as CategoryNode[]),
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  private createId(prefix: 'cat' | 'attr'): string {
    const random = Math.random().toString(36).slice(2, 9);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
  }

  private unique(values: string[]): string[] {
    const bucket = new Set<string>();
    for (const item of values) {
      bucket.add(item);
    }

    return [...bucket];
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
