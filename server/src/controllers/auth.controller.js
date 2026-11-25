import { loginUser, registerUser } from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const result = await registerUser({ username, email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  const { status, ...user } = req.user;
  res.json({ user });
}
