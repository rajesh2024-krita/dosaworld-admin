import type { LoginUser, User } from '@shared/schema';

export interface AuthUser extends User {
  permissions: string[];
  token?: string; // from backend (JWT)
}

export class AuthService {
  static async login(credentials: LoginUser): Promise<AuthUser> {
    const response = await fetch("https://dosaworld-backend.vercel.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const authUser: AuthUser = await response.json();
    localStorage.setItem("session", JSON.stringify(authUser)); // Save session
    return authUser;
  }

  static async register(userData: any): Promise<AuthUser> {
    const response = await fetch("https://dosaworld-backend.vercel.app/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const authUser: AuthUser = await response.json();
    localStorage.setItem("session", JSON.stringify(authUser));
    return authUser;
  }

  static logout(): void {
    const session = localStorage.getItem("session");
    if (session) {
      // Optionally call backend logout endpoint here
      console.log("User logged out:", JSON.parse(session).name);
    }
    localStorage.removeItem("session");
  }

  static getCurrentUser(): AuthUser | null {
    const session = localStorage.getItem("session");
    return session ? JSON.parse(session) : null;
  }

  static async quickLogin(roleType: 'admin' | 'manager' | 'staff'): Promise<AuthUser> {
    const roleMap: Record<string, LoginUser> = {
      admin: { email: "admin@example.com", password: "admin123" },
      manager: { email: "manager@example.com", password: "manager123" },
      staff: { email: "staff@example.com", password: "staff123" }
    };

    return this.login(roleMap[roleType]);
  }
}
