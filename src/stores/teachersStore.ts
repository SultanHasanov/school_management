import { makeAutoObservable, runInAction } from 'mobx';
import { message } from 'antd';

export interface Teacher {
  id: number;
  category?: string;
  created_at: string;
  education?: string;
  full_name: string;
  note?: string;
  ped_experience?: number;
  phone: string;
  position: string;
  school_id?: number;
  total_experience?: number;
  work_start?: string;
  subject: string;
}

export interface TeacherFormData {
  full_name: string;
  phone: string;
  position: string;
  subject: string;
  category?: string;
  education?: string;
  note?: string;
  ped_experience?: number;
  total_experience?: number;
  work_start?: string;
}

class TeachersStore {
  teachers: Teacher[] = [];
  loading = false;
  searchText = '';
  selectedSubject: string | null = null;
  private authToken: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadToken();
  }

  // Загрузка токена из localStorage
  private loadToken() {
    this.authToken = localStorage.getItem('token')
  }

  // Установка токена
  setToken(token: string) {
    this.authToken = token;
  }

  // Получение заголовков с авторизацией
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Загрузка учителей с API
  async loadTeachers() {
    this.loading = true;
    try {
      const response = await fetch('https://api.achkhoy-obr.ru/staff', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Неавторизованный доступ. Проверьте токен.');
        }
        throw new Error(`Ошибка загрузки данных: ${response.status}`);
      }
      
      const data = await response.json();
      runInAction(() => {
        this.teachers = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.loading = false;
      });
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки учителей';
      message.error(errorMessage);
      console.error('Error loading teachers:', error);
    }
  }

  // Добавление учителя
  async addTeacher(teacherData: TeacherFormData) {
    try {
      const newTeacher = {
        ...teacherData,
        id: 0, // ID будет установлен сервером
        created_at: new Date().toISOString(),
        school_id: 1 // Замените на актуальный school_id
      };

      const response = await fetch('https://api.achkhoy-obr.ru/staff', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(newTeacher),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Неавторизованный доступ. Проверьте токен.');
        }
        throw new Error(`Ошибка добавления учителя: ${response.status}`);
      }

      const createdTeacher = await response.json();
      
      runInAction(() => {
        this.teachers.unshift(createdTeacher);
      });
      
      message.success('Учитель успешно добавлен');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления учителя';
      message.error(errorMessage);
      console.error('Error adding teacher:', error);
      return false;
    }
  }

  // Обновление учителя
  async updateTeacher(id: number, teacherData: TeacherFormData) {
    try {
      const response = await fetch(`https://api.achkhoy-obr.ru/staff/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(teacherData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Неавторизованный доступ. Проверьте токен.');
        }
        throw new Error(`Ошибка обновления учителя: ${response.status}`);
      }

      const updatedTeacher = await response.json();
      
      runInAction(() => {
        const index = this.teachers.findIndex(teacher => teacher.id === id);
        if (index !== -1) {
          this.teachers[index] = updatedTeacher;
        }
      });
      
      message.success('Учитель успешно обновлен');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления учителя';
      message.error(errorMessage);
      console.error('Error updating teacher:', error);
      return false;
    }
  }

  // Удаление учителя
  async deleteTeacher(id: number) {
    try {
      const response = await fetch(`https://api.achkhoy-obr.ru/staff/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Неавторизованный доступ. Проверьте токен.');
        }
        throw new Error(`Ошибка удаления учителя: ${response.status}`);
      }

      runInAction(() => {
        this.teachers = this.teachers.filter(teacher => teacher.id !== id);
      });
      
      message.success('Учитель успешно удален');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления учителя';
      message.error(errorMessage);
      console.error('Error deleting teacher:', error);
      return false;
    }
  }

  // Поиск и фильтрация
  setSearchText(text: string) {
    this.searchText = text;
  }

  setSelectedSubject(subject: string | null) {
    this.selectedSubject = subject;
  }

  // Получение отфильтрованных учителей
  get filteredTeachers() {
    return this.teachers?.filter((teacher) => {
      const matchesSearch = teacher.full_name
        .toLowerCase()
        .includes(this.searchText.toLowerCase());
      const matchesSubject = !this.selectedSubject || teacher.subject === this.selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }

  // Получение уникальных предметов
  get uniqueSubjects() {
    return Array.from(new Set(this.teachers?.map(teacher => teacher.subject))).sort();
  }
}

export const teachersStore = new TeachersStore();