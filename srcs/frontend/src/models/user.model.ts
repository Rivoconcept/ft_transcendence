export interface User {
	id: number;
	username: string;
	realname: string;
	avatar: string;
	is_online: boolean;
}

export interface UserCreate {
	username: string;
	realname: string;
	avatar: null | string;
	password: string;
}

export interface UserUpdate {
	username?: string;
	realname?: string;
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
