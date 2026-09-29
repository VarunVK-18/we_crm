import { AutoFillUtils } from './autofill-utils';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('AutoFillUtils', () => {
  let mockComponent: any;
  let mockApiService: any;

  beforeEach(() => {
    // Create a dummy component that has some empty fields
    mockComponent = {
      panNumber: '',
      gstNumber: '',
      companyAddress: '',
      unmappedField: ''
    };

    // Create a dummy ApiService
    mockApiService = {
      get: vi.fn().mockReturnValue(of({
        profile: {
          pan: 'ABCDE1234F',
          gstin: '27ABCDE1234F1Z5',
          address: '123 Test Street'
        }
      }))
    };
  });

  it('should successfully map fields from the backend profile to the component properties', async () => {
    await AutoFillUtils.autoFillWithProfile(mockComponent, 'Test Entity', {}, mockApiService);

    expect(mockApiService.get).toHaveBeenCalledWith('entity-profile?entityName=Test%20Entity');
    expect(mockComponent.panNumber).toBe('ABCDE1234F');
    expect(mockComponent.gstNumber).toBe('27ABCDE1234F1Z5');
    expect(mockComponent.companyAddress).toBe('123 Test Street');
    // Field that was not mapped should remain empty
    expect(mockComponent.unmappedField).toBe('');
  });

  it('should not overwrite existing non-empty fields', async () => {
    mockComponent.panNumber = 'EXISTING_PAN';
    await AutoFillUtils.autoFillWithProfile(mockComponent, 'Test Entity', {}, mockApiService);

    expect(mockComponent.panNumber).toBe('EXISTING_PAN');
    expect(mockComponent.gstNumber).toBe('27ABCDE1234F1Z5');
  });

  it('should fallback to User model data if API fails', async () => {
    // Make API fail
    mockApiService.get = vi.fn().mockReturnValue(throwError(() => new Error('API Error')));
    const { DocumentMatcher } = await import('./document-matcher');
    vi.spyOn(DocumentMatcher, 'findExistingEntity').mockReturnValue({ pan: 'USER_PAN', gstin: 'USER_GST' });

    const mockUser = {
      client_entities: [
        { name: 'Test Entity', pan: 'USER_PAN', gstin: 'USER_GST' }
      ]
    };

    await AutoFillUtils.autoFillWithProfile(mockComponent, 'Test Entity', mockUser, mockApiService);

    expect(mockComponent.panNumber).toBe('USER_PAN');
    expect(mockComponent.gstNumber).toBe('USER_GST');
  });
});
