import { makeAutoObservable, runInAction } from "mobx";

interface LoginCredentials {
  email: string;
  password: string;
}

interface DecodedToken {
  exp: number;
  role: string;
  user_id: number;
}

class AuthStore {
  token: string | null = null;
  role: string | null = null;
  userId: number | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && !this.isTokenExpired(token)) {
      this.token = token;
      this.role = role;

      const decoded = this.decodeToken(token);
      if (decoded) {
        this.userId = decoded.user_id;
      }
    } else {
      this.clearAuth();
    }
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split(".")[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
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

  private saveToLocalStorage(token: string, role: string): void {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  }

  private clearLocalStorage(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  }

  *login(credentials: LoginCredentials) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        "https://api.achkhoy-obr.ru/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: { token: string } = yield response.json();

      const decodedToken = this.decodeToken(data.token);
      if (!decodedToken) {
        throw new Error("Invalid token received");
      }

      runInAction(() => {
        this.token = data.token;
        this.role = decodedToken.role;
        this.userId = decodedToken.user_id;
        this.saveToLocalStorage(data.token, decodedToken.role);
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Login failed";
      });
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
    this.error = null;
    this.clearLocalStorage();
  }

  clearAuth() {
    this.token = null;
    this.role = null;
    this.userId = null;
    this.clearLocalStorage();
  }

  get isAuthenticated(): boolean {
    return !!this.token && !this.isTokenExpired(this.token);
  }
}

export const authStore = new AuthStore();
