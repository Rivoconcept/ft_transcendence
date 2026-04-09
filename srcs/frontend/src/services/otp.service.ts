import apiService from './api.service';

class OtpService {
	async generateByEmail(email: string): Promise<{ otp_expiration: string; user: { id: number; username: string; avatar: string } }> {
		return apiService.post<{ otp_expiration: string; user: { id: number; username: string; avatar: string } }>('otp/public/generate', { email });
	}

	async validateByEmail(email: string, code: string, confirm: boolean = false): Promise<{ valid: boolean; userId: number }> {
		return apiService.post<{ valid: boolean; userId: number }>('otp/public/validate', { email, code, confirm });
	}
}

export const otpService = new OtpService();
export default otpService;
