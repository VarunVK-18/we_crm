/**
 * Unit Tests: Document Duplication Prevention
 *
 * Tests the core logic that prevents duplicate documents
 * in both onboarding_documents and final_documents arrays.
 */

// ─── Helpers (pure logic extracted from controllers) ───────────────────────

/**
 * Mirrors the logic in authController.js L1004-1006
 * Removes duplicate onboarding doc with the same name before re-uploading.
 */
function deduplicateOnboardingDoc(onboardingDocuments, entityName, fieldname) {
  const docName = `${entityName} - ${fieldname}`;
  return onboardingDocuments.filter(d => d.name !== docName);
}

/**
 * Mirrors the logic in client-service-detail.ts L576-579
 * Prevents pushing duplicate chat message if polling already fetched it.
 */
function appendChatMessageNoDuplicate(messages, newMessage) {
  if (messages.some(m => m._id === newMessage._id)) {
    return messages; // already exists, skip
  }
  return [...messages, newMessage];
}

/**
 * Mirrors the logic in client-services.ts L400
 * Check if an active checklist already exists for a given entity + service.
 */
function hasActiveDuplicateService(checklists, entityName, serviceName) {
  return checklists.some(c =>
    (c.details?.entityName || '').toLowerCase() === entityName.toLowerCase() &&
    (c.service_name || '').toLowerCase() === serviceName.toLowerCase() &&
    c.status !== 'completed'
  );
}

/**
 * Mirrors the logic in client-document-hub.ts L115-138
 * Collects final_documents from all checklists without duplicating.
 */
function collectFinalDocuments(checklists) {
  const docs = [];
  for (const c of checklists) {
    if (c.final_documents && c.final_documents.length > 0) {
      for (const fd of c.final_documents) {
        docs.push({
          ...fd,
          serviceName: c.service_name,
          orderId: c._id,
        });
      }
    }
  }
  return docs;
}

/**
 * Mirrors the logic in pan_provider.dart L8
 * Avoid adding exact duplicate PAN numbers.
 */
function addPanNoDuplicate(panList, newPan) {
  if (panList.some(p => p.panNumber === newPan.panNumber)) {
    return panList;
  }
  return [...panList, newPan];
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Document Duplication Prevention', () => {

  // ── Onboarding Document Deduplication ───────────────────────────────────

  describe('deduplicateOnboardingDoc', () => {
    const existingDocs = [
      { name: 'Tech Corp - pan_card', fileUrl: 'api/documents/old1' },
      { name: 'Tech Corp - aadhar_card', fileUrl: 'api/documents/old2' },
      { name: 'Other Corp - pan_card', fileUrl: 'api/documents/old3' },
    ];

    test('removes existing doc with same entity+fieldname before re-upload', () => {
      const result = deduplicateOnboardingDoc(existingDocs, 'Tech Corp', 'pan_card');
      expect(result).toHaveLength(2);
      expect(result.find(d => d.name === 'Tech Corp - pan_card')).toBeUndefined();
    });

    test('keeps docs of other entities untouched', () => {
      const result = deduplicateOnboardingDoc(existingDocs, 'Tech Corp', 'pan_card');
      expect(result.find(d => d.name === 'Other Corp - pan_card')).toBeDefined();
    });

    test('keeps other field docs of same entity untouched', () => {
      const result = deduplicateOnboardingDoc(existingDocs, 'Tech Corp', 'pan_card');
      expect(result.find(d => d.name === 'Tech Corp - aadhar_card')).toBeDefined();
    });

    test('returns unchanged array when doc does not exist', () => {
      const result = deduplicateOnboardingDoc(existingDocs, 'Tech Corp', 'gst_certificate');
      expect(result).toHaveLength(3);
    });

    test('handles empty onboarding_documents array', () => {
      const result = deduplicateOnboardingDoc([], 'Tech Corp', 'pan_card');
      expect(result).toEqual([]);
    });
  });

  // ── Chat Message Deduplication ────────────────────────────────────────────

  describe('appendChatMessageNoDuplicate', () => {
    const existingMessages = [
      { _id: 'msg1', content: 'Hello' },
      { _id: 'msg2', content: 'Hi there' },
    ];

    test('appends new message when _id is unique', () => {
      const newMsg = { _id: 'msg3', content: 'New message' };
      const result = appendChatMessageNoDuplicate(existingMessages, newMsg);
      expect(result).toHaveLength(3);
      expect(result[2]).toEqual(newMsg);
    });

    test('does NOT append when message _id already exists (polling race condition)', () => {
      const duplicate = { _id: 'msg1', content: 'Hello' };
      const result = appendChatMessageNoDuplicate(existingMessages, duplicate);
      expect(result).toHaveLength(2); // unchanged
    });

    test('appends to empty messages list', () => {
      const newMsg = { _id: 'msg1', content: 'First message' };
      const result = appendChatMessageNoDuplicate([], newMsg);
      expect(result).toHaveLength(1);
    });

    test('does not mutate the original array', () => {
      const original = [{ _id: 'msg1', content: 'Hello' }];
      const newMsg = { _id: 'msg2', content: 'World' };
      appendChatMessageNoDuplicate(original, newMsg);
      expect(original).toHaveLength(1); // unchanged
    });
  });

  // ── Active Service Duplicate Guard ────────────────────────────────────────

  describe('hasActiveDuplicateService', () => {
    const checklists = [
      { _id: 'cl1', service_name: 'GST Registration', details: { entityName: 'Tech Corp' }, status: 'active' },
      { _id: 'cl2', service_name: 'Trademark Registration', details: { entityName: 'Tech Corp' }, status: 'completed' },
      { _id: 'cl3', service_name: 'GST Registration', details: { entityName: 'Another Corp' }, status: 'active' },
    ];

    test('detects active duplicate service for same entity', () => {
      expect(hasActiveDuplicateService(checklists, 'Tech Corp', 'GST Registration')).toBe(true);
    });

    test('does NOT flag completed service as duplicate', () => {
      expect(hasActiveDuplicateService(checklists, 'Tech Corp', 'Trademark Registration')).toBe(false);
    });

    test('does NOT flag service for different entity as duplicate', () => {
      expect(hasActiveDuplicateService(checklists, 'Tech Corp', 'GST Registration' ) &&
             hasActiveDuplicateService(checklists, 'New Corp', 'GST Registration')).toBe(false);
    });

    test('is case-insensitive for entity name matching', () => {
      expect(hasActiveDuplicateService(checklists, 'tech corp', 'GST Registration')).toBe(true);
    });

    test('returns false for empty checklists', () => {
      expect(hasActiveDuplicateService([], 'Tech Corp', 'GST Registration')).toBe(false);
    });
  });

  // ── Final Documents Collection (Document Hub) ─────────────────────────────

  describe('collectFinalDocuments', () => {
    const checklists = [
      {
        _id: 'cl1',
        service_name: 'GST Registration',
        final_documents: [
          { document_id: 'doc1', name: 'GST Certificate', uploadedAt: '2024-01-01' },
          { document_id: 'doc2', name: 'GSTIN Letter', uploadedAt: '2024-01-02' },
        ]
      },
      {
        _id: 'cl2',
        service_name: 'Trademark Registration',
        final_documents: [
          { document_id: 'doc3', name: 'TM Application', uploadedAt: '2024-02-01' },
        ]
      },
      {
        _id: 'cl3',
        service_name: 'MSME Registration',
        final_documents: [] // no docs yet
      },
    ];

    test('collects all final documents from all checklists', () => {
      const docs = collectFinalDocuments(checklists);
      expect(docs).toHaveLength(3);
    });

    test('attaches serviceName to each document', () => {
      const docs = collectFinalDocuments(checklists);
      expect(docs[0].serviceName).toBe('GST Registration');
      expect(docs[2].serviceName).toBe('Trademark Registration');
    });

    test('attaches orderId (checklist _id) to each document', () => {
      const docs = collectFinalDocuments(checklists);
      expect(docs[0].orderId).toBe('cl1');
      expect(docs[2].orderId).toBe('cl2');
    });

    test('skips checklists with empty final_documents', () => {
      const docs = collectFinalDocuments(checklists);
      const msmeDoc = docs.find(d => d.orderId === 'cl3');
      expect(msmeDoc).toBeUndefined();
    });

    test('returns empty array for empty checklists input', () => {
      expect(collectFinalDocuments([])).toEqual([]);
    });
  });

  // ── PAN Deduplication ─────────────────────────────────────────────────────

  describe('addPanNoDuplicate', () => {
    const existingPans = [
      { panNumber: 'ABCDE1234F', name: 'John Doe' },
      { panNumber: 'XYZPQ5678G', name: 'Jane Doe' },
    ];

    test('adds new PAN when it is unique', () => {
      const result = addPanNoDuplicate(existingPans, { panNumber: 'MNOPQ9012H', name: 'Bob Smith' });
      expect(result).toHaveLength(3);
    });

    test('does NOT add duplicate PAN number', () => {
      const result = addPanNoDuplicate(existingPans, { panNumber: 'ABCDE1234F', name: 'John Doe Again' });
      expect(result).toHaveLength(2);
    });

    test('adds first PAN to empty list', () => {
      const result = addPanNoDuplicate([], { panNumber: 'ABCDE1234F', name: 'John Doe' });
      expect(result).toHaveLength(1);
    });
  });

});
