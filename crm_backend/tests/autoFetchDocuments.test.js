/**
 * Unit Tests: Auto-Fetch Documents & Data Logic
 *
 * Tests the data transformation, filtering, and polling behaviour
 * mirrors from both client-service-detail.ts and orders_provider.dart
 */

// ─── Helpers (pure logic extracted from app code) ──────────────────────────

/**
 * Mirrors client-service-detail.ts L349–391
 * Derives the order status from checklist data.
 */
function deriveOrderStatus(checklist) {
  const isAssigned = !!checklist.assigned_to;
  let status = checklist.status === 'completed'
    ? 'completed'
    : (!isAssigned ? 'not-initialized' : 'in-progress');

  if (status === 'in-progress') {
    const needsDocUpload = checklist.requested_documents?.some(doc => !doc.isUploaded);
    const clientFormSubmitted = checklist.details?.clientFormSubmitted === true;
    if (needsDocUpload || !clientFormSubmitted || checklist.action_required) {
      status = 'action-required';
    }
  }
  return status;
}

/**
 * Mirrors client-service-detail.ts L751–753
 * Filters out director_ prefixed documents from final_documents.
 */
function filterFinalDocs(docs) {
  if (!docs) return [];
  return docs.filter(d => !d?.name?.startsWith('director_'));
}

/**
 * Mirrors client-service-detail.ts L653–664
 * Determines if payment is pending after service completion.
 */
function isPaymentPending(order) {
  const dealClosed = order.dealClosedAmount || 0;
  const advancePaid = order.advanceAmountPaid || 0;
  const isCompleted = order.derivedStatus === 'completed' ||
    (order.items && order.items.filter(i => i.isChecked).length === order.items.length && order.items.length > 0);
  return isCompleted && (dealClosed > advancePaid);
}

/**
 * Mirrors client-document-hub.ts L48–68
 * Filters documents by entity name and search query.
 */
function filterDocuments(docs, selectedEntity, searchQuery) {
  let result = docs;

  if (selectedEntity !== 'All') {
    result = result.filter(doc =>
      (doc.entityName || '').toLowerCase() === selectedEntity.toLowerCase()
    );
  }

  const q = (searchQuery || '').toLowerCase().trim();
  if (q) {
    result = result.filter(doc =>
      doc.name?.toLowerCase().includes(q) ||
      doc.serviceName?.toLowerCase().includes(q)
    );
  }

  return result;
}

/**
 * Mirrors orders_provider.dart L31–90
 * Maps raw API checklist summary into a ServiceOrder-like object.
 */
function mapChecklistToOrder(c, uid, fallbackCompanyName = '') {
  const details = c.details || {};
  const entityName =
    details.entityName?.toString() ||
    details.companyName?.toString() ||
    details.businessName?.toString() ||
    details.proposed_company_name?.toString() ||
    fallbackCompanyName ||
    'Default Entity';

  const isAssigned = !!c.assigned_to;

  return {
    id: c._id,
    clientUid: uid,
    serviceType: c.service_name || '',
    entityName,
    status: c.status === 'completed' ? 'complete' : (!isAssigned ? 'notInitialized' : 'active'),
    stage: c.status === 'completed' ? 'completed' : (!isAssigned ? 'reqReceived' : 'workInProgress'),
    actionRequired: c.action_required || false,
  };
}

/**
 * Mirrors client-service-detail.ts L627-630
 * Returns only completed items.
 */
function getCompletedItems(items) {
  return (items || []).filter(i => i.isChecked);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Auto-Fetch Documents & Data Logic', () => {

  // ── Order Status Derivation ───────────────────────────────────────────────

  describe('deriveOrderStatus', () => {
    test('returns "completed" when checklist status is completed', () => {
      const checklist = { status: 'completed', assigned_to: { _id: 'usr1' }, requested_documents: [], details: {} };
      expect(deriveOrderStatus(checklist)).toBe('completed');
    });

    test('returns "not-initialized" when no expert assigned', () => {
      const checklist = { status: 'active', assigned_to: null, requested_documents: [], details: {} };
      expect(deriveOrderStatus(checklist)).toBe('not-initialized');
    });

    test('returns "in-progress" when assigned and all docs uploaded and form submitted', () => {
      const checklist = {
        status: 'active',
        assigned_to: { _id: 'usr1' },
        requested_documents: [{ isUploaded: true }],
        details: { clientFormSubmitted: true },
        action_required: false,
      };
      expect(deriveOrderStatus(checklist)).toBe('in-progress');
    });

    test('returns "action-required" when a requested document is not uploaded', () => {
      const checklist = {
        status: 'active',
        assigned_to: { _id: 'usr1' },
        requested_documents: [{ isUploaded: false }],
        details: { clientFormSubmitted: true },
        action_required: false,
      };
      expect(deriveOrderStatus(checklist)).toBe('action-required');
    });

    test('returns "action-required" when client form not yet submitted', () => {
      const checklist = {
        status: 'active',
        assigned_to: { _id: 'usr1' },
        requested_documents: [{ isUploaded: true }],
        details: { clientFormSubmitted: false },
        action_required: false,
      };
      expect(deriveOrderStatus(checklist)).toBe('action-required');
    });

    test('returns "action-required" when action_required flag is set', () => {
      const checklist = {
        status: 'active',
        assigned_to: { _id: 'usr1' },
        requested_documents: [{ isUploaded: true }],
        details: { clientFormSubmitted: true },
        action_required: true,
      };
      expect(deriveOrderStatus(checklist)).toBe('action-required');
    });
  });

  // ── Final Documents Filter (director_ prefix) ─────────────────────────────

  describe('filterFinalDocs', () => {
    const docs = [
      { name: 'GST Certificate', document_id: 'doc1' },
      { name: 'director_1_pan', document_id: 'doc2' },
      { name: 'director_2_aadhar', document_id: 'doc3' },
      { name: 'Certificate of Incorporation', document_id: 'doc4' },
    ];

    test('removes documents prefixed with "director_"', () => {
      const result = filterFinalDocs(docs);
      expect(result).toHaveLength(2);
      expect(result.find(d => d.name.startsWith('director_'))).toBeUndefined();
    });

    test('keeps regular documents', () => {
      const result = filterFinalDocs(docs);
      expect(result.find(d => d.name === 'GST Certificate')).toBeDefined();
      expect(result.find(d => d.name === 'Certificate of Incorporation')).toBeDefined();
    });

    test('returns empty array when docs is null/undefined', () => {
      expect(filterFinalDocs(null)).toEqual([]);
      expect(filterFinalDocs(undefined)).toEqual([]);
    });

    test('returns all docs when none are director_ prefixed', () => {
      const cleanDocs = [{ name: 'PAN Card', document_id: 'doc1' }];
      expect(filterFinalDocs(cleanDocs)).toHaveLength(1);
    });
  });

  // ── Payment Pending Detection ─────────────────────────────────────────────

  describe('isPaymentPending', () => {
    test('returns true when completed service has outstanding balance', () => {
      const order = {
        derivedStatus: 'completed',
        dealClosedAmount: 10000,
        advanceAmountPaid: 5000,
        items: [{ isChecked: true }],
      };
      expect(isPaymentPending(order)).toBe(true);
    });

    test('returns false when full payment received', () => {
      const order = {
        derivedStatus: 'completed',
        dealClosedAmount: 10000,
        advanceAmountPaid: 10000,
        items: [{ isChecked: true }],
      };
      expect(isPaymentPending(order)).toBe(false);
    });

    test('returns false when service is not yet completed', () => {
      const order = {
        derivedStatus: 'in-progress',
        dealClosedAmount: 10000,
        advanceAmountPaid: 5000,
        items: [{ isChecked: false }],
      };
      expect(isPaymentPending(order)).toBe(false);
    });

    test('returns false when dealClosedAmount is 0', () => {
      const order = {
        derivedStatus: 'completed',
        dealClosedAmount: 0,
        advanceAmountPaid: 0,
        items: [{ isChecked: true }],
      };
      expect(isPaymentPending(order)).toBe(false);
    });

    test('detects payment pending via all-items-checked fallback', () => {
      const order = {
        derivedStatus: 'in-progress',
        dealClosedAmount: 10000,
        advanceAmountPaid: 2000,
        items: [{ isChecked: true }, { isChecked: true }],
      };
      expect(isPaymentPending(order)).toBe(true);
    });
  });

  // ── Document Hub Filtering ────────────────────────────────────────────────

  describe('filterDocuments', () => {
    const docs = [
      { name: 'GST Certificate', serviceName: 'GST Registration', entityName: 'Tech Corp' },
      { name: 'TM Application', serviceName: 'Trademark Registration', entityName: 'Tech Corp' },
      { name: 'MSME Certificate', serviceName: 'MSME Registration', entityName: 'Another Corp' },
    ];

    test('returns all docs when entity is "All" and no search', () => {
      expect(filterDocuments(docs, 'All', '')).toHaveLength(3);
    });

    test('filters docs by entity name', () => {
      const result = filterDocuments(docs, 'Tech Corp', '');
      expect(result).toHaveLength(2);
      expect(result.every(d => d.entityName === 'Tech Corp')).toBe(true);
    });

    test('filters docs by search query (document name)', () => {
      const result = filterDocuments(docs, 'All', 'gst');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('GST Certificate');
    });

    test('filters docs by search query (service name)', () => {
      const result = filterDocuments(docs, 'All', 'trademark');
      expect(result).toHaveLength(1);
      expect(result[0].serviceName).toBe('Trademark Registration');
    });

    test('combines entity + search filter', () => {
      const result = filterDocuments(docs, 'Tech Corp', 'gst');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('GST Certificate');
    });

    test('returns empty array when no docs match', () => {
      expect(filterDocuments(docs, 'Unknown Corp', '')).toHaveLength(0);
    });

    test('is case-insensitive for entity filtering', () => {
      const result = filterDocuments(docs, 'tech corp', '');
      expect(result).toHaveLength(2);
    });
  });

  // ── Checklist → ServiceOrder Mapping ────────────────────────────────────

  describe('mapChecklistToOrder', () => {
    const uid = 'user123';

    test('maps status "completed" correctly', () => {
      const c = { _id: 'cl1', status: 'completed', service_name: 'GST Registration', assigned_to: { _id: 'exp1' }, details: { entityName: 'Tech Corp' } };
      const order = mapChecklistToOrder(c, uid);
      expect(order.status).toBe('complete');
      expect(order.stage).toBe('completed');
    });

    test('maps "notInitialized" when no expert assigned', () => {
      const c = { _id: 'cl2', status: 'active', service_name: 'MSME', assigned_to: null, details: {} };
      const order = mapChecklistToOrder(c, uid, 'My Company');
      expect(order.status).toBe('notInitialized');
      expect(order.stage).toBe('reqReceived');
    });

    test('maps "active" when expert assigned and not completed', () => {
      const c = { _id: 'cl3', status: 'active', service_name: 'Trademark', assigned_to: { _id: 'exp2' }, details: { entityName: 'Brand Co' } };
      const order = mapChecklistToOrder(c, uid);
      expect(order.status).toBe('active');
      expect(order.stage).toBe('workInProgress');
    });

    test('uses entityName from details', () => {
      const c = { _id: 'cl4', status: 'active', service_name: 'GST', assigned_to: null, details: { entityName: 'My Entity' } };
      const order = mapChecklistToOrder(c, uid);
      expect(order.entityName).toBe('My Entity');
    });

    test('falls back to companyName when entityName is missing', () => {
      const c = { _id: 'cl5', status: 'active', service_name: 'GST', assigned_to: null, details: { companyName: 'Fallback Corp' } };
      const order = mapChecklistToOrder(c, uid);
      expect(order.entityName).toBe('Fallback Corp');
    });

    test('falls back to "Default Entity" when all names missing', () => {
      const c = { _id: 'cl6', status: 'active', service_name: 'GST', assigned_to: null, details: {} };
      const order = mapChecklistToOrder(c, uid);
      expect(order.entityName).toBe('Default Entity');
    });

    test('sets actionRequired flag from checklist', () => {
      const c = { _id: 'cl7', status: 'active', service_name: 'GST', assigned_to: null, details: {}, action_required: true };
      const order = mapChecklistToOrder(c, uid);
      expect(order.actionRequired).toBe(true);
    });
  });

  // ── Completed Items Count ─────────────────────────────────────────────────

  describe('getCompletedItems', () => {
    const items = [
      { title: 'Step 1', isChecked: true },
      { title: 'Step 2', isChecked: false },
      { title: 'Step 3', isChecked: true },
    ];

    test('returns only checked items', () => {
      expect(getCompletedItems(items)).toHaveLength(2);
    });

    test('returns empty array when no items checked', () => {
      expect(getCompletedItems([{ isChecked: false }])).toHaveLength(0);
    });

    test('returns empty array for null/undefined input', () => {
      expect(getCompletedItems(null)).toHaveLength(0);
      expect(getCompletedItems(undefined)).toHaveLength(0);
    });

    test('returns all items when all are checked', () => {
      const allChecked = [{ isChecked: true }, { isChecked: true }];
      expect(getCompletedItems(allChecked)).toHaveLength(2);
    });
  });

});
