import fs from 'node:fs';
import path from 'node:path';
import type { ValidationResult } from '../types/profile';

interface EntityContract<TSerialized extends { id: string; createdAt?: string }> {
  id: string;
  createdAt?: string;
  validate?: () => ValidationResult;
  toJSON: () => TSerialized;
}

type Predicate<T> = (item: T) => boolean;
type Selector<T, TResult> = (item: T) => TResult;

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

function compareValues(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  const aText = String(a ?? '');
  const bText = String(b ?? '');
  if (aText < bText) {
    return -1;
  }
  if (aText > bText) {
    return 1;
  }
  return 0;
}

class BaseRepository<
  TEntity extends EntityContract<TSerialized>,
  TSerialized extends { id: string; createdAt?: string }
> {
  protected filePath: string;
  protected EntityClass: new (data: Partial<TSerialized>) => TEntity;

  constructor(filePath: string, EntityClass: new (data: Partial<TSerialized>) => TEntity) {
    this.filePath = filePath;
    this.EntityClass = EntityClass;
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
    }
  }

  protected getAllRaw(): TSerialized[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(data || '[]');
      return Array.isArray(parsed) ? (parsed as TSerialized[]) : [];
    } catch (error) {
      console.error('Error reading file:', error);
      return [];
    }
  }

  protected saveAllRaw(items: TSerialized[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf8');
  }

  getAll(): TEntity[] {
    return this.getAllRaw().map((item) => new this.EntityClass(item));
  }

  getById(id: string): TEntity | null {
    const item = this.getAll().find((entity) => entity.id === id);
    return item || null;
  }

  where(predicate: Predicate<TEntity>): TEntity[] {
    return this.getAll().filter(predicate);
  }

  single(predicate: Predicate<TEntity>): TEntity | null {
    const items = this.where(predicate);
    return items.length > 0 ? items[0] : null;
  }

  any(predicate: Predicate<TEntity>): boolean {
    return this.where(predicate).length > 0;
  }

  count(predicate?: Predicate<TEntity>): number {
    const items = this.getAll();
    if (!predicate) {
      return items.length;
    }
    return items.filter(predicate).length;
  }

  orderBy<TKey>(selector: Selector<TEntity, TKey>, descending = false): TEntity[] {
    const sorted = [...this.getAll()].sort((a, b) => {
      const base = compareValues(selector(a), selector(b));
      return descending ? -base : base;
    });
    return sorted;
  }

  paginate(pageNumber: number, pageSize: number): PaginatedResult<TEntity> {
    const allItems = this.getAll();
    const totalCount = allItems.length;
    const startIndex = (pageNumber - 1) * pageSize;
    const items = allItems.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      pageNumber,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  add(data: Partial<TSerialized>): TEntity {
    const entity = new this.EntityClass(data);
    if (entity.validate) {
      const validation = entity.validate();
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    const items = this.getAllRaw();
    items.push(entity.toJSON());
    this.saveAllRaw(items);

    return entity;
  }

  update(id: string, data: Partial<TSerialized>): TEntity {
    const rawItems = this.getAllRaw();
    const index = rawItems.findIndex((item) => String(item.id) === id);

    if (index === -1) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const existingItem = rawItems[index];
    const updatedEntity = new this.EntityClass({
      ...existingItem,
      ...data,
      id,
      createdAt: existingItem.createdAt
    });

    if (updatedEntity.validate) {
      const validation = updatedEntity.validate();
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    rawItems[index] = updatedEntity.toJSON();
    this.saveAllRaw(rawItems);

    return updatedEntity;
  }

  delete(id: string): boolean {
    const rawItems = this.getAllRaw();
    const index = rawItems.findIndex((item) => String(item.id) === id);

    if (index === -1) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    rawItems.splice(index, 1);
    this.saveAllRaw(rawItems);
    return true;
  }

  deleteWhere(predicate: Predicate<TEntity>): number {
    const items = this.getAll();
    const initialCount = items.length;
    const filteredItems = items.filter((item) => !predicate(item)).map((item) => item.toJSON());

    this.saveAllRaw(filteredItems);

    return initialCount - filteredItems.length;
  }

  aggregate(selector: Selector<TEntity, number>, type: 'min' | 'max' = 'min'): number | null {
    const items = this.getAll();
    if (items.length === 0) {
      return null;
    }

    const values = items.map(selector);
    return type === 'min' ? Math.min(...values) : Math.max(...values);
  }

  distinct<TKey>(selector: Selector<TEntity, TKey>): TKey[] {
    const values = this.getAll().map(selector);
    return [...new Set(values)];
  }

  query(): QueryBuilder<TEntity> {
    return new QueryBuilder<TEntity>(this.getAll());
  }
}

class QueryBuilder<TEntity> {
  private items: TEntity[];
  private predicates: Predicate<TEntity>[];
  private sortSelector: Selector<TEntity, unknown> | null;
  private descending: boolean;

  constructor(items: TEntity[]) {
    this.items = items;
    this.predicates = [];
    this.sortSelector = null;
    this.descending = false;
  }

  where(predicate: Predicate<TEntity>): QueryBuilder<TEntity> {
    this.predicates.push(predicate);
    return this;
  }

  orderBy<TKey>(selector: Selector<TEntity, TKey>, descending = false): QueryBuilder<TEntity> {
    this.sortSelector = selector as Selector<TEntity, unknown>;
    this.descending = descending;
    return this;
  }

  toList(): TEntity[] {
    let results = [...this.items];

    for (const predicate of this.predicates) {
      results = results.filter(predicate);
    }

    if (this.sortSelector) {
      results.sort((a, b) => {
        const base = compareValues(this.sortSelector?.(a), this.sortSelector?.(b));
        return this.descending ? -base : base;
      });
    }

    return results;
  }

  paginate(pageNumber: number, pageSize: number): PaginatedResult<TEntity> {
    const results = this.toList();
    const totalCount = results.length;
    const startIndex = (pageNumber - 1) * pageSize;
    const items = results.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      pageNumber,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  first(): TEntity | null {
    const results = this.toList();
    return results.length > 0 ? results[0] : null;
  }

  count(): number {
    return this.toList().length;
  }
}

export default BaseRepository;
