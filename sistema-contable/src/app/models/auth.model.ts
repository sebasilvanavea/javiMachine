export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  provider?: 'google' | 'email';
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  role?: 'admin' | 'user';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
