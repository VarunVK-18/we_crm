const orderController = require('../controllers/orderController');
const Checklist = require('../models/Checklist');

// Mock Checklist Model
jest.mock('../models/Checklist');

describe('DUNS Form Submission', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'order123' },
      body: {
        applicantName: 'John Doe',
        legalBusinessName: 'Acme Corp',
        businessType: 'Private Limited',
        hasDirectorDetails: 'true',
        directorFirstName: 'Jane',
        gstDocument_existing: 'existing-gst-url.pdf'
      },
      files: {
        incorpCert: [{ path: 'temp/incorp.pdf' }],
        panCard: [{ path: 'temp/pan.pdf' }],
        addressProof: [{ path: 'temp/address.pdf' }]
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    Checklist.findById.mockClear();
  });

  it('should successfully submit form and merge docs', async () => {
    const mockOrder = {
      _id: 'order123',
      details: {},
      save: jest.fn().mockResolvedValue(true),
      markModified: jest.fn()
    };

    Checklist.findById.mockResolvedValue(mockOrder);

    await orderController.submitDunsForm(req, res);

    expect(Checklist.findById).toHaveBeenCalledWith('order123');
    
    // Verify details were updated correctly
    expect(mockOrder.details.dunsForm).toBeDefined();
    expect(mockOrder.details.dunsForm.applicantName).toBe('John Doe');
    
    // Verify docs were merged correctly
    const docs = mockOrder.details.dunsDocs;
    expect(docs).toHaveLength(4); // Incorp, PAN, Address (from files) + GST (from body)
    expect(docs.find(d => d.name === 'GST Document').fileUrl).toBe('existing-gst-url.pdf');
    expect(docs.find(d => d.name === 'Incorporation Certificate').fileUrl).toBe('temp/incorp.pdf');

    expect(mockOrder.action_required).toBe(false);
    expect(mockOrder.markModified).toHaveBeenCalledWith('details');
    expect(mockOrder.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should handle GST document upload via files correctly', async () => {
    const mockOrder = {
      _id: 'order123',
      details: {},
      save: jest.fn(),
      markModified: jest.fn()
    };

    req.files.gstDocument = [{ path: 'temp/new-gst.pdf' }];
    delete req.body.gstDocument_existing;
    
    Checklist.findById.mockResolvedValue(mockOrder);

    await orderController.submitDunsForm(req, res);

    const docs = mockOrder.details.dunsDocs;
    expect(docs).toHaveLength(4);
    expect(docs.find(d => d.name === 'GST Document').fileUrl).toBe('temp/new-gst.pdf');
  });

  it('should return 404 if order not found', async () => {
    Checklist.findById.mockResolvedValue(null);

    await orderController.submitDunsForm(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Order (Checklist) not found.' }));
  });

  it('should return 500 on database error', async () => {
    Checklist.findById.mockRejectedValue(new Error('DB failure'));

    await orderController.submitDunsForm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Server error while submitting DUNS form.' }));
  });
});
