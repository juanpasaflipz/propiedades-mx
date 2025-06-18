import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validateBody } from '../middleware/validation';
import { LoginSchema, RegisterSchema } from '../validation/schemas';
import { requireAuth } from '../middleware/auth';

const router = Router();
const authService = new AuthService();

// Login endpoint
router.post('/login', validateBody(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await authService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Save refresh token
    await authService.saveRefreshToken(user.id, refreshToken);

    // Return user data and tokens
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register endpoint
router.post('/register', validateBody(RegisterSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    if (await authService.userExists(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await authService.createUser(email, password, name);

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Save refresh token
    await authService.saveRefreshToken(user.id, refreshToken);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = authService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Validate token in database
    const isValid = await authService.validateRefreshToken(payload.userId, refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get updated user info
    const user = await authService.findUserById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = authService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Save new refresh token
    await authService.saveRefreshToken(user.id, tokens.refreshToken);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout endpoint
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await authService.revokeRefreshToken(req.user.id);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user endpoint
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export { router as authRoutes };