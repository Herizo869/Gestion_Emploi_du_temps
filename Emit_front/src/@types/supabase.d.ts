declare module "@supabase/supabase-js" {
  export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  }

  export interface User {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    user_metadata: Record<string, any>;
  }

  export interface AuthError {
    message: string;
    name: string;
    status?: number;
  }

  export interface AuthResponse {
    data: { user: User | null; session: Session | null };
    error: AuthError | null;
  }

  export interface SupabaseClient {
    auth: {
      signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>;
      signUp(credentials: { email: string; password: string; options?: any }): Promise<AuthResponse>;
      signOut(): Promise<{ error: AuthError | null }>;
      getSession(): Promise<{ data: { session: Session | null } }>;
      onAuthStateChange(callback: (event: string, session: Session | null) => void): {
        data: { subscription: { unsubscribe(): void } };
      };
      resend(options: { type: string; email: string }): Promise<{ error: AuthError | null }>;
    };
    from(table: string): any;
  }

  export function createClient(supabaseUrl: string, supabaseKey: string): SupabaseClient;
}
