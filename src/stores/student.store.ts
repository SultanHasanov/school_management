import { makeAutoObservable, runInAction } from "mobx";
import { authStore } from "./auth.store";
import { classStore, Class } from "./class.store";

export interface Student {
  id: number;
  address?: string;
  birth_date?: string;
  class_id: number;
  created_at?: string;
  full_name: string;
  gender?: string;
  note?: string;
  phone?: string;
  school_id?: number;
}

interface CreateStudentData {
  address?: string;
  birth_date?: string;
  class_id: number;
  full_name: string;
  gender?: string;
  note?: string;
  phone?: string;
  school_id?: number;
   class: string;
}

export interface StudentFilters {
  full_name?: string;
  gender?: string;
  class_id?: number;
  grade_from?: number;
  grade_to?: number;
  age_from?: number;
  age_to?: number;
}

interface UpdateStudentData extends Partial<CreateStudentData> {
  id: number;
}

class StudentStore {
  students: Student[] = [];
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

  currentFilters: StudentFilters = {};

  *fetchStudents(filters: StudentFilters = {}) {
    this.isLoading = true;
    this.error = null;
    this.currentFilters = filters; // сохраняем фильтры

    try {
      if (classStore.classes.length === 0) {
        yield classStore.fetchClasses();
      }

      // Собираем параметры запроса
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `https://api.achkhoy-obr.ru/students${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response: Response = yield fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Student[] = yield response.json();

      runInAction(() => {
        this.students = data || [];
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch students";
        this.students = [];
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  // Добавь метод для очистки фильтров
  clearFilters() {
    this.currentFilters = {};
  }
  

  *createStudent(studentData: CreateStudentData) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        "https://api.achkhoy-obr.ru/students",
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(studentData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newStudent: Student = yield response.json();

      runInAction(() => {
        this.students.push(newStudent);
      });

      return newStudent;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to create student";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *updateStudent(studentData: UpdateStudentData) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        `https://api.achkhoy-obr.ru/students/${studentData.id}`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(studentData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedStudent: Student = yield response.json();

      runInAction(() => {
        const index = this.students.findIndex(
          (student) => student.id === studentData.id
        );
        if (index !== -1) {
          this.students[index] = updatedStudent;
        }
      });

      return updatedStudent;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to update student";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  *deleteStudent(studentId: number) {
    this.isLoading = true;
    this.error = null;

    try {
      const response: Response = yield fetch(
        `https://api.achkhoy-obr.ru/students/${studentId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      runInAction(() => {
        this.students = this.students.filter(
          (student) => student.id !== studentId
        );
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to delete student";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

getStudentWithClass(student: Student): Student & { class?: Class } {
  const classInfo = classStore.classes.find(
    (cls) => Number(cls.id) === student.class_id
  );
  return {
    ...student,
    class: classInfo,
  };
}



  get studentsWithClasses(): (Student & { class?: Class })[] {
    return this.students.map((student) => this.getStudentWithClass(student));
  }

  getStudentById(id: number): (Student & { class?: Class }) | undefined {
    const student = this.students.find((s) => s.id === id);
    return student ? this.getStudentWithClass(student) : undefined;
  }

  clearError() {
    this.error = null;
  }
}

export const studentStore = new StudentStore();