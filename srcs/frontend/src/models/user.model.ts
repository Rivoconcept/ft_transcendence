export interface User {
	id: number;
	username: string;
	email: string;
	avatar: string;
	is_online: boolean;
	is_confirmed: boolean;
}

export interface UserCreate {
	username: string;
	email: string;
	avatar: null | string;
	password: string;
}

export interface UserUpdate {
	username?: string;
	email?: string;
	avatar?: string;
	password?: string;
}

export interface UserLogin {
	username: string;
	password: string;
}

export interface AuthResponse {
	user: User;
	tokens: {
		accessToken: string;
		refreshToken: string;
	};
}
