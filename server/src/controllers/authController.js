import { asyncHandler } from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import * as authService from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const user = await authService.register(body);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  res.json({ user });
});
