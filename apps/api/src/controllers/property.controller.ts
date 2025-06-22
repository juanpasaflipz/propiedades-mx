import { Request, Response, NextFunction } from 'express';
import { PropertyService } from '../services/property.service';
import { Logger } from '../utils/logger';
import { PropertySearchSchema, PropertyIdSchema, LocationParamsSchema } from '../validation/property.schemas';
import { z } from 'zod';

export class PropertyController {
  constructor(
    private propertyService: PropertyService,
    private logger: Logger
  ) {}

  searchProperties = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validatedFilters = PropertySearchSchema.parse(req.query);
      
      // Log request
      this.logger.info('Property search request', { 
        filters: validatedFilters,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      // Search properties
      const properties = await this.propertyService.searchProperties(validatedFilters);
      
      // Transform for frontend compatibility
      const transformedProperties = properties.map(property => ({
        id: property.id,
        title: property.description || property.address || 'Property',
        price: property.price.amount,
        currency: property.price.currency,
        location: `${property.city}${property.state_province ? ', ' + property.state_province : ''}`,
        propertyType: property.property_type,
        transactionType: property.transaction_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area_sqm,
        imageUrl: property.images[0] || '/placeholder-property.svg',
        listingUrl: property.listing_url || property.contact_info || '#',
        description: property.description,
        publishedAt: property.listing_date,
      }));

      // Get total count for pagination
      // TODO: Implement count query for proper pagination
      const total = transformedProperties.length;

      // Return response
      res.json({
        listings: transformedProperties,
        total,
        page: validatedFilters.page,
        totalPages: Math.ceil(total / validatedFilters.limit),
        success: true
      });

      // Log successful response
      this.logger.info('Property search completed', {
        resultCount: transformedProperties.length,
        page: validatedFilters.page
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        // Validation error
        this.logger.warn('Property search validation failed', {
          errors: error.errors,
          query: req.query
        });
        
        return res.status(400).json({ 
          error: 'Invalid search parameters',
          details: error.errors,
          success: false
        });
      }

      // Pass to error handler
      next(error);
    }
  };

  getPropertyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { id } = PropertyIdSchema.parse(req.params);
      
      this.logger.info('Get property by ID request', { id });

      // Get property
      const property = await this.propertyService.getPropertyById(id);
      
      if (!property) {
        this.logger.info('Property not found', { id });
        return res.status(404).json({ 
          error: 'Property not found',
          success: false
        });
      }

      // Return property
      res.json({
        data: property,
        success: true
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid property ID format',
          success: false
        });
      }
      next(error);
    }
  };

  getPropertiesByCountry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { country } = LocationParamsSchema.parse(req.params);
      
      if (!country) {
        return res.status(400).json({ 
          error: 'Country parameter is required',
          success: false
        });
      }

      this.logger.info('Get properties by country request', { country });

      // Get properties
      const properties = await this.propertyService.getPropertiesByCountry(country);
      
      res.json({
        properties,
        count: properties.length,
        success: true
      });

    } catch (error) {
      next(error);
    }
  };

  getPropertiesByCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { city } = LocationParamsSchema.parse(req.params);
      
      if (!city) {
        return res.status(400).json({ 
          error: 'City parameter is required',
          success: false
        });
      }

      this.logger.info('Get properties by city request', { city });

      // Get properties
      const properties = await this.propertyService.getPropertiesByCity(city);
      
      res.json({
        properties,
        count: properties.length,
        success: true
      });

    } catch (error) {
      next(error);
    }
  };

  getPropertyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.info('Get property statistics request');

      // Get stats
      const stats = await this.propertyService.getPropertyStats();
      
      res.json({
        data: stats,
        success: true
      });

    } catch (error) {
      next(error);
    }
  };
}