import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { context7MCPService } from '../services/context7-mcp.service';
import { AppError } from '../utils/errors';
import { container } from '../container';

const logger = container.get('logger');

const router = Router();

// Schema validation
const DocumentationQuerySchema = z.object({
  library: z.string().min(1).max(100),
  query: z.string().optional(),
});

const EnhancedSearchSchema = z.object({
  searchQuery: z.string().min(1).max(500),
  includeDocumentation: z.boolean().default(true),
});

// Get documentation for a specific library
router.post('/documentation', requireAuth, async (req, res, next) => {
  try {
    const { library, query } = DocumentationQuerySchema.parse(req.body);
    
    const documentation = await context7MCPService.getDocumentation(library, query);
    
    res.json({
      success: true,
      data: documentation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid request format', 400));
    } else {
      logger.error('Documentation fetch error:', error);
      next(new AppError('Failed to fetch documentation', 500));
    }
  }
});

// Enhanced property search with up-to-date documentation context
router.post('/enhanced-search', requireAuth, async (req, res, next) => {
  try {
    const { searchQuery, includeDocumentation } = EnhancedSearchSchema.parse(req.body);
    
    let documentationContext = null;
    
    if (includeDocumentation) {
      documentationContext = await context7MCPService.enhancePropertySearchWithDocs(searchQuery);
    }
    
    res.json({
      success: true,
      data: {
        searchQuery,
        documentationContext,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid request format', 400));
    } else {
      logger.error('Enhanced search error:', error);
      next(new AppError('Failed to perform enhanced search', 500));
    }
  }
});

// Get supported libraries
router.get('/libraries', requireAuth, async (_req, res, next) => {
  try {
    // This could be expanded to dynamically query Context7 for supported libraries
    const supportedLibraries = [
      'react',
      'nextjs',
      'postgresql',
      'pgvector',
      'typescript',
      'express',
      'prisma',
      'tailwindcss',
      'zod',
      'jest',
    ];
    
    res.json({
      success: true,
      data: {
        libraries: supportedLibraries,
        total: supportedLibraries.length,
      },
    });
  } catch (error) {
    next(new AppError('Failed to fetch supported libraries', 500));
  }
});

export default router;