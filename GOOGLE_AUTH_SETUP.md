# Google Authentication Setup Guide

## Option 1: NextAuth Implementation (Recommended)

### Step 1: Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://propiedades-mx-web.vercel.app/api/auth/callback/google` (prod)

### Step 2: Update Environment Variables
```env
# Add to .env.local (frontend)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=https://propiedades-mx-web.vercel.app
NEXTAUTH_SECRET=generate-random-32-char-string
```

### Step 3: Update NextAuth Configuration
```typescript
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Call your existing API
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })
        const user = await res.json()
        
        if (res.ok && user) {
          return user
        }
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Create or update user in your database
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth`, {
          method: 'POST',
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider: 'google',
            providerId: user.id
          }),
          headers: { "Content-Type": "application/json" }
        })
      }
      return true
    },
    async session({ session, token }) {
      // Add custom fields to session
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  }
})

export { handler as GET, handler as POST }
```

### Step 4: Update Login Page
```tsx
// Add to signin page
import { signIn } from 'next-auth/react'

<button
  onClick={() => signIn('google', { callbackUrl: '/' })}
  className="flex items-center justify-center gap-2 w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    {/* Google icon SVG */}
  </svg>
  Continue with Google
</button>
```

### Step 5: Database Migration
```sql
-- Add OAuth fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'credentials',
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_provider_id 
ON users(provider, provider_id);
```

### Step 6: Backend API Route for OAuth
```typescript
// Add to auth.routes.ts
router.post('/oauth', async (req, res) => {
  const { email, name, provider, providerId } = req.body
  
  // Find or create user
  let user = await findUserByEmail(email)
  
  if (!user) {
    user = await createUser({
      email,
      name,
      provider,
      provider_id: providerId,
      email_verified: true,
      role: 'user'
    })
  }
  
  // Generate JWT tokens
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)
  
  res.json({ accessToken, refreshToken, user })
})
```

## Option 2: Keep Current System + Add OAuth

If you prefer to keep your current JWT system and just add Google OAuth:

1. Install Google OAuth library: `npm install google-auth-library`
2. Add OAuth endpoints to your Express API
3. Verify Google tokens server-side
4. Generate your custom JWT tokens after OAuth success
5. Store provider info in database

## Difficulty Comparison

### NextAuth Route (Easier):
- ✅ Built-in Google OAuth support
- ✅ Handles token management
- ✅ Session management included
- ✅ Well-documented
- ❌ Requires refactoring current auth

### Custom OAuth Route (Harder):
- ✅ Keeps current architecture
- ✅ More control
- ❌ More code to write
- ❌ Handle OAuth flow manually
- ❌ Token exchange complexity

## Time Estimate

- **NextAuth Implementation**: 2-4 hours
- **Custom OAuth Implementation**: 4-8 hours

## Recommendation

Use NextAuth since it's already installed. It will handle:
- OAuth flow
- Token refresh
- Session management
- Security best practices
- Multiple providers (can add more later)