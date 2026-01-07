import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, realname, password, avatar } = req.body;

    if (!username || !realname || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await authService.register({ username, realname, password, avatar });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await authService.login({ username, password });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token refresh failed";
    res.status(401).json({ error: message });
  }
}
