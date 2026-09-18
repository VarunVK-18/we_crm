const mongoose = require('mongoose');
const { _syncProfileData } = require('../controllers/orderController');
const User = require('../models/User');
const EntityProfile = require('../models/EntityProfile');

jest.mock('../models/User');
jest.mock('../models/EntityProfile');

describe('syncProfileData Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync dynamic directors array from new forms engine', async () => {
    const mockOrder = { client_id: 'mockUserId123', entity_name: 'Test Dynamic Corp' };
    
    // The new forms engine submits directors under formData.dynamicData.directors
    const formData = {
      dynamicData: {
        pan: 'ABCDE1234F',
        directors: [
          { fullName: 'John Doe', din: '12345678', shareholding: 50 },
          { fullName: 'Jane Doe', pan: 'FGHIJ5678K', shareholding: 50 }
        ]
      }
    };
    const uploadedDocs = [
      { name: 'directors[0].photo', fileUrl: '/api/documents/111111111111111111111111' },
      { name: 'directors[1].panDoc', fileUrl: '/api/documents/222222222222222222222222' }
    ];

    User.findById.mockResolvedValue({ _id: 'mockUserId123' });
    
    const mockProfile = {
      save: jest.fn().mockResolvedValue(true),
      markModified: jest.fn()
    };
    EntityProfile.findOne.mockResolvedValue(mockProfile);

    await _syncProfileData(mockOrder, formData, uploadedDocs);

    expect(User.findById).toHaveBeenCalledWith('mockUserId123');
    expect(EntityProfile.findOne).toHaveBeenCalledWith({ uid: 'mockUserId123', entityName: 'Test Dynamic Corp' });
    
    // Check known field mapped
    expect(mockProfile.pan).toBe('ABCDE1234F');
    
    // Check directors array mapping
    expect(mockProfile.directors).toBeDefined();
    expect(mockProfile.directors.length).toBe(2);
    expect(mockProfile.directors[0].fullName).toBe('John Doe');
    expect(mockProfile.directors[0].din).toBe('12345678');
    expect(mockProfile.directors[0].photoDocId).toBe('111111111111111111111111');
    expect(mockProfile.directors[1].fullName).toBe('Jane Doe');
    expect(mockProfile.directors[1].pan).toBe('FGHIJ5678K');
    expect(mockProfile.directors[1].panDocId).toBe('222222222222222222222222');
    
    expect(mockProfile.save).toHaveBeenCalled();
  });

  it('should fallback to order.details.directors for legacy forms like LLP', async () => {
    // Legacy forms don't have formData.dynamicData.directors
    const mockOrder = { 
      client_id: 'mockUserId456', 
      entity_name: 'Test Legacy LLP',
      details: {
        directors: [
          { fullName: 'Old Director', din: '87654321', shareholding: 100 }
        ]
      }
    };
    const formData = { dynamicData: { email: 'test@llp.com' } };
    const uploadedDocs = [];

    User.findById.mockResolvedValue({ _id: 'mockUserId456' });
    
    const mockProfile = {
      save: jest.fn().mockResolvedValue(true),
      markModified: jest.fn()
    };
    EntityProfile.findOne.mockResolvedValue(null);
    EntityProfile.mockImplementation(() => mockProfile);

    await _syncProfileData(mockOrder, formData, uploadedDocs);

    expect(mockProfile.email).toBe('test@llp.com');
    expect(mockProfile.directors).toBeDefined();
    expect(mockProfile.directors.length).toBe(1);
    expect(mockProfile.directors[0].fullName).toBe('Old Director');
    expect(mockProfile.directors[0].din).toBe('87654321');
    expect(mockProfile.save).toHaveBeenCalled();
  });
});
