import { createIdentifier } from '@toeverything/infra';

export interface AuthProvider {
  signInMagicLink(email: string, token: string): Promise<void>;

  signInOauth(
    code: string,
    state: string,
    provider: string
  ): Promise<{ redirectUri?: string }>;

  signInPassword(credential: {
    email: string;
    password: string;
    verifyToken?: string;
    challenge?: string;
  }): Promise<void>;

  signOut(): Promise<void>;
}

export const AuthProvider = createIdentifier<AuthProvider>('AuthProvider');
