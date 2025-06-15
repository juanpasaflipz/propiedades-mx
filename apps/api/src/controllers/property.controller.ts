import { Request, Response } from 'express';
import { PropertyService } from '../services/property.service';

export class PropertyController {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService();
  }

  searchProperties = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      console.log('Searching properties with filters:', filters);
      const properties = await this.propertyService.searchProperties(filters);
      
      // Transform properties to match frontend expectations
      const transformedProperties = properties.map(property => ({
        id: property.id,
        title: property.description,
        price: property.price.amount,
        currency: property.price.currency,
        location: {
          city: property.city,
          country: property.country,
          address: property.address,
        },
        propertyType: property.property_type,
        transactionType: property.transaction_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area_sqm,
        imageUrl: property.images[0] || '/placeholder-property.svg',
        listingUrl: '#',
        description: property.description,
        publishedAt: property.listing_date,
      }));
      
      // Return in the expected format
      res.json({
        listings: transformedProperties,
        total: transformedProperties.length,
        page: 1,
        totalPages: 1
      });
    } catch (error: any) {
      console.error('Error searching properties:', error);
      res.status(500).json({ 
        error: 'Error searching properties',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

  getPropertyById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const property = await this.propertyService.getPropertyById(id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching property' });
    }
  };

  getPropertiesByCountry = async (req: Request, res: Response) => {
    try {
      const { country } = req.params;
      const properties = await this.propertyService.getPropertiesByCountry(country);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching properties by country' });
    }
  };

  getPropertiesByCity = async (req: Request, res: Response) => {
    try {
      const { city } = req.params;
      const properties = await this.propertyService.getPropertiesByCity(city);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching properties by city' });
    }
  };
} 