// stores/class.store.ts
import { makeAutoObservable, runInAction } from "mobx";
import { authStore } from "./auth.store";

export interface Class {
  id: string;
  name: string;
  grade: number;
  academic_year: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateClassData {
  name: string;
  grade: number;
}

interface UpdateClassData extends CreateClassData {
  id: string;
}

class ClassStore {
  classes: Class[] = []; // Инициализируем пустым массивом, а не null
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  private getAuthHeaders(): HeadersInit {
    const token = authStore.token;
    if (!token) {
      throw new Error("No authentication token");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  *fetchClasses() {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        "https://api.achkhoy-obr.ru/classes",
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Class[] = yield response.json();

      runInAction(() => {
        this.classes = data || []; // Гарантируем, что это массив
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch classes";
        this.classes = []; // В случае ошибки устанавливаем пустой массив
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *createClass(classData: CreateClassData) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        "https://api.achkhoy-obr.ru/classes",
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(classData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newClass: Class = yield response.json();

      runInAction(() => {
        this.classes.push(newClass);
      });

      return newClass;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to create class";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *updateClass(classData: UpdateClassData) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        `https://api.achkhoy-obr.ru/classes/${classData.id}`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            name: classData.name,
            grade: classData.grade,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedClass: Class = yield response.json();

      runInAction(() => {
        const index = this.classes.findIndex((cls) => cls.id === classData.id);
        if (index !== -1) {
          this.classes[index] = updatedClass;
        }
      });

      return updatedClass;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to update class";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *deleteClass(classId: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        `https://api.achkhoy-obr.ru/classes/${classId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      runInAction(() => {
        this.classes = this.classes.filter((cls) => cls.id !== classId);
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to delete class";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Исправлено: добавляем проверку на null/undefined
  get filteredClasses(): Class[] {
    if (!this.classes || this.classes.length === 0) {
      return [];
    }
    return this.classes.slice().sort((a, b) => a.grade - b.grade);
  }

  // Исправлено: добавляем проверку на null/undefined
  get uniqueGrades(): number[] {
    if (!this.classes || this.classes.length === 0) {
      return [];
    }
    const grades = Array.from(new Set(this.classes.map((cls) => cls.grade)));
    return grades.slice().sort((a, b) => a - b);
  }

  clearError() {
    this.error = null;
  }
}

export const classStore = new ClassStore();
