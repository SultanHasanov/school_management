import { makeAutoObservable, runInAction } from "mobx";

interface LoginCredentials {
  email: string;
  password: string;
}

interface DecodedToken {
  exp: number;
  role: string;
  user_id: number;
  school_name: string;
}

class AuthStore {
  token: string | null = null;
  role: string | null = null;
  userId: number | null = null;
  schoolName: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const schoolName = localStorage.getItem("school_name");

    if (token && !this.isTokenExpired(token)) {
      this.token = token;
      this.role = role;
      this.schoolName = schoolName;

      const decoded = this.decodeToken(token);
      if (decoded) {
        this.userId = decoded.user_id;
      }
    } else {
      this.clearAuth();
    }
  }

  // ✅ исправлено декодирование base64url → UTF-8
  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split(".")[1];

      // Преобразуем base64url в стандартный Base64
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

      // Декодируем в UTF-8 безопасно
      const decodedPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const decoded: DecodedToken = JSON.parse(decodedPayload);

      if (decoded.school_name) {
        localStorage.setItem("school_name", decoded.school_name);
      }

      return decoded;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  private saveToLocalStorage(token: string, role: string, schoolName?: string): void {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    if (schoolName) {
      localStorage.setItem("school_name", schoolName);
    }
  }

  private clearLocalStorage(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("school_name");
  }

  async login(credentials: LoginCredentials) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch("https://api.achkhoy-obr.ru/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: { token: string } = await response.json();
      const decodedToken = this.decodeToken(data.token);

      if (!decodedToken) {
        throw new Error("Invalid token received");
      }

      runInAction(() => {
        this.token = data.token;
        this.role = decodedToken.role;
        this.userId = decodedToken.user_id;
        this.schoolName = decodedToken.school_name || null;
        this.saveToLocalStorage(data.token, decodedToken.role, decodedToken.school_name);
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Login failed";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  logout() {
    this.token = null;
    this.role = null;
    this.userId = null;
    this.schoolName = null;
    this.error = null;
    this.clearLocalStorage();
  }

  clearAuth() {
    this.token = null;
    this.role = null;
    this.userId = null;
    this.schoolName = null;
    this.clearLocalStorage();
  }

  get isAuthenticated(): boolean {
    return !!this.token && !this.isTokenExpired(this.token);
  }
}

export const authStore = new AuthStore();
