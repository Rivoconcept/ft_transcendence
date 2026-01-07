import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../database/entities/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";

export interface RegisterDTO {
  username: string;
  realname: string;
  password: string;
  avatar?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(data: RegisterDTO): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const existingUser = await this.userRepository.findOne({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      username: data.username,
      realname: data.realname,
      password: hashedPassword,
      avatar: data.avatar || "",
      is_online: false,
    });

    await this.userRepository.save(user);

    const tokens = this.generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  async login(data: LoginDTO): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const user = await this.userRepository.findOne({
      where: { username: data.username },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const tokens = this.generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return this.generateTokens(user);
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  }

  private generateTokens(user: User): TokenPair {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
