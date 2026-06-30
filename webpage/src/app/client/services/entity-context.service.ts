import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EntityContextService {
  private readonly STORAGE_KEY = 'client_selected_entity';

  /** All entity names derived from the client's checklists */
  availableEntities = signal<string[]>([]);

  /** Currently selected entity. 'All' means no filter. */
  selectedEntity = signal<string>('All');

  constructor() {
    // Restore last selection from localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.selectedEntity.set(saved);
    }
  }

  setEntities(names: string[]) {
    // Deduplicate, sort, always include 'All'
    const unique = Array.from(new Set(names.filter(n => n && n.trim()))).sort();
    this.availableEntities.set(unique);

    // If the previously selected entity no longer exists in the list, reset to All
    const current = this.selectedEntity();
    if (current !== 'All' && !unique.includes(current)) {
      this.selectEntity('All');
    }
  }

  selectEntity(name: string) {
    this.selectedEntity.set(name);
    localStorage.setItem(this.STORAGE_KEY, name);
  }

  /** Returns true if a filter is active (not 'All') */
  isFiltered = computed(() => this.selectedEntity() !== 'All');

  /**
   * Helper: given an order/checklist object, returns the resolved entity name.
   * Priority: entityName > companyName > details.entityName > details.companyName >
   *           details.proposed_company_name > details.businessName > details.entity_name
   */
  resolveEntityName(order: any): string {
    return (
      order.details?.entityName ||
      order.details?.entity_name ||
      order.entityName ||
      order.companyName ||
      order.details?.companyName ||
      order.details?.proposed_company_name ||
      order.details?.businessName ||
      ''
    ).trim();
  }

  /**
   * Returns true if the given order matches the currently selected entity filter.
   * Always returns true when filter is 'All'.
   */
  matchesFilter(order: any): boolean {
    const sel = this.selectedEntity();
    if (sel === 'All') return true;
    const name = this.resolveEntityName(order);
    return name.toLowerCase() === sel.toLowerCase();
  }
}
