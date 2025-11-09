// stores/schools.store.ts
import { makeAutoObservable, runInAction } from "mobx";

export interface School {
  id: string;
  name: string;
  director: string;
  class_count: number;
  student_count: number;
  user_id: number;
  user: {
    id: number;
    email: string;
    password: string;
    role: string;
  };
  created_at: string;
}

export interface CreateSchoolData {
  director: string;
  email: string;
  name: string;
}

export interface UpdateSchoolData {
  name?: string;
  director?: string;
  email?: string;
}

class SchoolsStore {
  schools: School[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  *fetchSchools() {
    this.isLoading = true;
    this.error = null;

    try {
      const token = localStorage.getItem("token");
      const response: Response = yield fetch(
        "https://api.achkhoy-obr.ru/roo/schools",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: School[] = yield response.json();

      runInAction(() => {
        this.schools = data;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Ошибка загрузки школ";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *createSchool(schoolData: CreateSchoolData) {
    this.isLoading = true;
    this.error = null;

    try {
      const token = localStorage.getItem("token");
      const response: Response = yield fetch(
        "https://api.achkhoy-obr.ru/roo/register_school",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(schoolData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newSchool: School = yield response.json();

      runInAction(() => {
        this.schools.push(newSchool);
      });

      return newSchool;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Ошибка создания школы";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *updateSchool(id: string, schoolData: UpdateSchoolData) {
    this.isLoading = true;
    this.error = null;

    try {
      const token = localStorage.getItem("token");
      const response: Response = yield fetch(
        `https://api.achkhoy-obr.ru/roo/schools/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(schoolData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedSchool: School = yield response.json();

      runInAction(() => {
        const index = this.schools.findIndex((s) => s.id === id);
        if (index !== -1) {
          this.schools[index] = updatedSchool;
        }
      });

      return updatedSchool;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Ошибка обновления школы";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *deleteSchool(id: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const token = localStorage.getItem("token");
      const response: Response = yield fetch(
        `https://api.achkhoy-obr.ru/roo/schools/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      runInAction(() => {
        this.schools = this.schools.filter((s) => s.id !== id);
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Ошибка удаления школы";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  clearError() {
    this.error = null;
  }

  get schoolsCount(): number {
    return this.schools?.length;
  }
}

export const schoolsStore = new SchoolsStore();