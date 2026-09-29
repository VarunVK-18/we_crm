import '../../models/user_model.dart';

class DocumentMatcher {
  static String normalizeEntityName(String name) {
    if (name.isEmpty) return "";
    return name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  }

  static dynamic findExistingDoc(String entityName, List<dynamic> docs, List<String> keywords) {
    if (docs.isEmpty) return null;

    final normalizedEntity = normalizeEntityName(entityName);

    try {
      return docs.firstWhere((d) {
        if (d == null || d['name'] == null) return false;
        final docName = d['name'].toString().toLowerCase();
        
        final parts = docName.split('-');
        
        bool startsWithEntity = false;
        if (parts.length > 1) {
          final docEntityPart = parts[0];
          final normalizedDocEntity = normalizeEntityName(docEntityPart);
          startsWithEntity = normalizedEntity.isEmpty || 
                             normalizedDocEntity.startsWith(normalizedEntity) || 
                             normalizedEntity.startsWith(normalizedDocEntity);
        } else {
          // General document
          startsWithEntity = true;
        }

        final hasKeyword = keywords.any((k) => docName.contains(k.toLowerCase()));

        return startsWithEntity && hasKeyword;
      });
    } catch (e) {
      return null;
    }
  }
}
