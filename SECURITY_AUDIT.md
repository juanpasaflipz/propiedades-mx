# Security Audit - Real Estate Aggregator MX

## 🚨 CRITICAL Security Issues Found

### 1. **No Authentication on Admin Routes**
**File**: `apps/api/src/routes/admin.routes.ts`
**Risk**: Anyone can trigger scraping, view logs, access admin functions
**Fix**: Implement authentication middleware immediately

### 2. **Exposed API Keys in Frontend**
**File**: `apps/web/.env.local`
**Risk**: Claude API key visible in browser
**Fix**: Move to backend API route, never expose in frontend

### 3. **SQL Injection Vulnerabilities**
**Location**: Direct string concatenation in queries
**Fix**: Use parameterized queries everywhere

### 4. **No Input Validation**
**Files**: All API endpoints
**Risk**: XSS, injection attacks, data corruption
**Fix**: Implement Zod or Joi validation

### 5. **Insecure CORS Configuration**
**File**: `apps/api/src/server.ts`
**Current**: Allows all origins in production
**Fix**: Whitelist specific domains

## Immediate Security Fixes

### 1. Secure Admin Routes
```typescript
// middleware/auth.ts
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !await verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// routes/admin.routes.ts
router.use(requireAuth); // Add this line
```

### 2. Move Claude API to Backend
```typescript
// apps/api/src/routes/ai.routes.ts
router.post('/parse-search', async (req, res) => {
  // Move AI logic here, keep API key server-side
  const result = await parseWithClaude(req.body.query);
  res.json(result);
});
```

### 3. Add Input Validation
```typescript
// validation/schemas.ts
import { z } from 'zod';

export const PropertySearchSchema = z.object({
  location: z.string().min(1).max(100),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  // ... etc
});

// Use in routes
router.get('/search', validate(PropertySearchSchema), async (req, res) => {
  // Safe to use validated data
});
```

### 4. Environment Variables Security
```bash
# .env.example (commit this)
DATABASE_URL=
CLAUDE_API_KEY=
SCRAPEDO_TOKEN=
JWT_SECRET=
NEXT_PUBLIC_API_URL=

# .env (never commit)
# Add to .gitignore
```

### 5. Add Security Headers
```typescript
// middleware/security.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## Security Checklist

- [ ] Implement JWT authentication
- [ ] Add refresh token rotation
- [ ] Set up HTTPS everywhere
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] Set secure cookie flags
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Set up WAF rules
- [ ] Regular dependency updates
- [ ] Security scanning in CI/CD
- [ ] Implement least privilege DB access
- [ ] Add audit logging
- [ ] Set up intrusion detection

## Recommended Security Stack

1. **Authentication**: NextAuth.js or Auth0
2. **Validation**: Zod
3. **Rate Limiting**: express-rate-limit
4. **Security Headers**: Helmet
5. **Monitoring**: Sentry
6. **Secrets Management**: Railway/Vercel Vault
7. **Static Analysis**: ESLint Security Plugin
8. **Dependency Scanning**: Dependabot

---

**Priority**: Fix authentication and input validation BEFORE beta launch