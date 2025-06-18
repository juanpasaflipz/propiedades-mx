import request from 'supertest';
import express from 'express';
import { propertyRoutes } from '../../routes/property.routes';
import { PropertyService } from '../../services/property.service';

// Mock PropertyService
jest.mock('../../services/property.service');

const app = express();
app.use(express.json());
app.use('/api/properties', propertyRoutes);

describe('Property Routes', () => {
  let mockPropertyService: jest.Mocked<PropertyService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPropertyService = new PropertyService() as jest.Mocked<PropertyService>;
  });

  describe('GET /api/properties/search', () => {
    it('should return properties based on search filters', async () => {
      const mockProperties = [
        {
          id: '1',
          source: 'test',
          country: 'Mexico',
          city: 'Mexico City',
          address: '123 Test St',
          price: { amount: 100000, currency: 'MXN' },
          property_type: 'house',
          bedrooms: 3,
          bathrooms: 2,
          area_sqm: 150
        }
      ];

      mockPropertyService.searchProperties.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties/search')
        .query({
          city: 'Mexico City',
          minPrice: '50000',
          maxPrice: '200000'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        properties: mockProperties,
        count: 1
      });
      
      expect(mockPropertyService.searchProperties).toHaveBeenCalledWith({
        city: 'Mexico City',
        minPrice: 50000,
        maxPrice: 200000
      });
    });

    it('should handle search with no results', async () => {
      mockPropertyService.searchProperties.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/properties/search')
        .query({ city: 'NonexistentCity' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        properties: [],
        count: 0
      });
    });

    it('should handle search errors', async () => {
      mockPropertyService.searchProperties.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/properties/search');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should return property by id', async () => {
      const mockProperty = {
        id: '123',
        source: 'test',
        country: 'Mexico',
        city: 'Mexico City',
        address: '123 Test St',
        price: { amount: 100000, currency: 'MXN' },
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        area_sqm: 150
      };

      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty);

      const response = await request(app)
        .get('/api/properties/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProperty);
    });

    it('should return 404 when property not found', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/properties/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Property not found' });
    });
  });

  describe('GET /api/properties/country/:country', () => {
    it('should return properties by country', async () => {
      const mockProperties = [
        {
          id: '1',
          country: 'Mexico',
          city: 'Mexico City'
        },
        {
          id: '2',
          country: 'Mexico',
          city: 'Guadalajara'
        }
      ];

      mockPropertyService.getPropertiesByCountry.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties/country/Mexico');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        properties: mockProperties,
        count: 2
      });
    });
  });

  describe('GET /api/properties/city/:city', () => {
    it('should return properties by city', async () => {
      const mockProperties = [
        {
          id: '1',
          city: 'Guadalajara',
          address: '456 Main St'
        }
      ];

      mockPropertyService.getPropertiesByCity.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties/city/Guadalajara');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        properties: mockProperties,
        count: 1
      });
    });
  });
});