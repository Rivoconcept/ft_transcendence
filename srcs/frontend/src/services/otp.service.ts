import apiService from './api.service';

class OtpService {
	// Authenticated (account confirmation)
	async generate(): Promise<{ otp_expiration: string }> {
		return apiService.post<{ otp_expiration: string }>('otp/generate', {});
	}

	async validate(code: string): Promise<{ is_confirmed: boolean }> {
		return apiService.post<{ is_confirmed: boolean }>('otp/validate', { code });
	}

	// Public (password recovery)
	async generateByEmail(email: string): Promise<{ otp_expiration: string; user: { id: number; username: string; avatar: string } }> {
		return apiService.post<{ otp_expiration: string; user: { id: number; username: string; avatar: string } }>('otp/public/generate', { email });
	}

	async validateByEmail(email: string, code: string): Promise<{ valid: boolean; userId: number }> {
		return apiService.post<{ valid: boolean; userId: number }>('otp/public/validate', { email, code });
	}
}

export const otpService = new OtpService();
export default otpService;
