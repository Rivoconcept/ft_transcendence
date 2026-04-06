import { AppDataSource } from "../database/data-source.js";
import { User } from "../database/entities/user.js";
import { emailService } from "./email.service.js";
import { randomInt } from "crypto";

const OTP_DURATION_SECONDS = 60;

class OtpService {
  private userRepository = AppDataSource.getRepository(User);

  private generateCode(): string {
    return String(randomInt(0, 1000000)).padStart(6, "0");
  }

  async generate(userId: number): Promise<{ otp_expiration: Date }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const code = this.generateCode();
    const expiration = new Date(Date.now() + OTP_DURATION_SECONDS * 1000);

    user.otp_code = code;
    user.otp_expiration = expiration;
    await this.userRepository.save(user);

    await emailService.sendOtp(user.email, code);

    return { otp_expiration: expiration };
  }

  async validate(userId: number, code: string): Promise<{ is_confirmed: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.otp_code || !user.otp_expiration) {
      throw new Error("No OTP code generated");
    }

    if (new Date() > user.otp_expiration) {
      user.otp_code = null;
      user.otp_expiration = null;
      await this.userRepository.save(user);
      throw new Error("OTP code has expired");
    }

    if (user.otp_code !== code) {
      throw new Error("Invalid OTP code");
    }

    user.is_confirmed = true;
    user.otp_code = null;
    user.otp_expiration = null;
    await this.userRepository.save(user);

    return { is_confirmed: true };
  }
}

export const otpService = new OtpService();
