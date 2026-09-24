export class DocumentMatcher {
  static normalizeEntityName(name: string): string {
    if (!name) return '';
    let normalized = name.toLowerCase();
    
    // Remove all non-alphanumeric characters (spaces, dashes, dots, etc.)
    normalized = normalized.replace(/[^a-z0-9]/g, '');
    
    // Remove common business entity suffixes
    const suffixes = ['pvtltd', 'privatelimited', 'llp', 'opc', 'co', 'inc', 'corp', 'corporation', 'limited', 'ltd'];
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.substring(0, normalized.length - suffix.length);
      }
    }
    
    return normalized;
  }

  static findExistingDoc(entityName: string | undefined, docs: any[], keywords: string[]): any {
    if (!docs || docs.length === 0) return null;
    
    const eName = entityName || '';
    const normalizedEntity = this.normalizeEntityName(eName);

    return docs.find((d: any) => {
      if (!d.name) return false;
      const docName = d.name.toLowerCase();
      
      // We extract the entity part of the document name. The backend saves it as "EntityName - fieldName"
      const parts = docName.split('-');
      
      let startsWithEntity = false;
      if (parts.length > 1) {
        const docEntityPart = parts[0];
        const normalizedDocEntity = this.normalizeEntityName(docEntityPart);
        startsWithEntity = !normalizedEntity || normalizedDocEntity.startsWith(normalizedEntity) || normalizedEntity.startsWith(normalizedDocEntity);
      } else {
        // If there is no entity prefix, treat it as a general document
        startsWithEntity = true;
      }

      const hasKeyword = keywords.some((k: string) => docName.includes(k.toLowerCase()));

      return startsWithEntity && hasKeyword;
    });
  }

  static findExistingEntity(entityName: string | undefined, entities: any[]): any {
    if (!entities || entities.length === 0 || !entityName) return null;
    const normalizedTarget = this.normalizeEntityName(entityName);
    
    return entities.find((e: any) => {
      if (!e.entityName) return false;
      const normalizedCurrent = this.normalizeEntityName(e.entityName);
      return normalizedCurrent === normalizedTarget || 
             normalizedCurrent.startsWith(normalizedTarget) || 
             normalizedTarget.startsWith(normalizedCurrent);
    });
  }
}
