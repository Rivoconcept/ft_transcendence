import apiService from './api.service';

class OtpService {
	async generate(): Promise<{ otp_expiration: string }> {
		return apiService.post<{ otp_expiration: string }>('otp/generate', {});
	}

	async validate(code: string): Promise<{ is_confirmed: boolean }> {
		return apiService.post<{ is_confirmed: boolean }>('otp/validate', { code });
	}
}

export const otpService = new OtpService();
export default otpService;
