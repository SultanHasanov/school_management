import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Tag,
  Dropdown,
  Checkbox,
  Select,
} from 'antd';
import { Plus, Pencil, Trash2, Search, Settings } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps, CheckboxChangeEvent } from 'antd';

interface Teacher {
  id: string;
  full_name: string;
  subject: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

interface ColumnSettings {
  key: string;
  title: string;
  visible: boolean;
}

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Настройки колонок
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([
    { key: 'full_name', title: 'ФИО', visible: true },
    { key: 'subject', title: 'Предмет', visible: true },
    { key: 'email', title: 'Email', visible: true },
    { key: 'phone', title: 'Телефон', visible: true },
    { key: 'actions', title: 'Действия', visible: true },
  ]);

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('teacherColumnsSettings');
    if (savedSettings) {
      setColumnSettings(JSON.parse(savedSettings));
    }
    const stored = localStorage.getItem('teachers');
    if (stored) {
      setTeachers(JSON.parse(stored));
    }
  }, []);

  // Сохранение настроек в localStorage
  useEffect(() => {
    localStorage.setItem('teacherColumnsSettings', JSON.stringify(columnSettings));
  }, [columnSettings]);

  const saveToStorage = (data: Teacher[]) => {
    localStorage.setItem('teachers', JSON.stringify(data));
  };

 

  const handleAdd = () => {
    setEditingTeacher(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      full_name: teacher.full_name,
      subject: teacher.subject,
      email: teacher.email,
      phone: teacher.phone,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = teachers.filter((t) => t.id !== id);
      setTeachers(updated);
      saveToStorage(updated);
      message.success('Учитель удален');
    } catch {
      message.error('Ошибка удаления учителя');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      let updated: Teacher[] = [];
      if (editingTeacher) {
        updated = teachers.map((t) =>
          t.id === editingTeacher.id
            ? { ...t, ...values, updated_at: new Date().toISOString() }
            : t
        );
        message.success('Учитель обновлен');
      } else {
        const newTeacher: Teacher = {
          id: Math.random().toString(36).substring(2),
          created_at: new Date().toISOString(),
          ...values,
        };
        updated = [newTeacher, ...teachers];
        message.success('Учитель добавлен');
      }
      setTeachers(updated);
      saveToStorage(updated);
      setModalVisible(false);
      form.resetFields();
    } catch {
      message.error('Ошибка сохранения учителя');
    }
  };

  // Обработчик изменения видимости колонок
  const handleColumnVisibilityChange = (key: string, visible: boolean, e: CheckboxChangeEvent) => {
    e.stopPropagation();
    setColumnSettings(prev =>
      prev.map(setting =>
        setting.key === key ? { ...setting, visible } : setting
      )
    );
  };

  // Сброс настроек колонок
  const resetColumnSettings = () => {
    const defaultSettings: ColumnSettings[] = [
      { key: 'full_name', title: 'ФИО', visible: true },
      { key: 'subject', title: 'Предмет', visible: true },
      { key: 'email', title: 'Email', visible: true },
      { key: 'phone', title: 'Телефон', visible: true },
      { key: 'actions', title: 'Действия', visible: true },
    ];
    setColumnSettings(defaultSettings);
    message.success('Настройки колонок сброшены');
  };

  // Получение уникальных предметов для фильтра
  const uniqueSubjects = Array.from(new Set(teachers.map(teacher => teacher.subject))).sort();

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.full_name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesSubject = !selectedSubject || teacher.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Базовые определения колонок
  const baseColumns: ColumnsType<Teacher> = [
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Предмет',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => <Tag color="green">{subject}</Tag>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Pencil size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить учителя?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
             overlayStyle={{
    position: 'fixed' // предотвращает прыжки
  }}
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Фильтрация колонок на основе настроек
  const visibleColumns = baseColumns.filter(column => 
    columnSettings.find(setting => setting.key === column.key)?.visible !== false
  );

  // Меню для настроек колонок
  const columnSettingsMenu: MenuProps = {
    items: [
      {
        key: 'columns',
        label: 'Видимые колонки',
        type: 'group',
        children: columnSettings.map(setting => ({
          key: setting.key,
          label: (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={setting.visible}
                onChange={(e) => handleColumnVisibilityChange(setting.key, e.target.checked, e)}
              >
                {setting.title}
              </Checkbox>
            </div>
          ),
        })),
      },
      {
        type: 'divider',
      },
      {
        key: 'reset',
        label: (
          <div onClick={(e) => e.stopPropagation()}>
            <Button type="link" onClick={resetColumnSettings} style={{ padding: 0 }}>
              Сбросить настройки
            </Button>
          </div>
        ),
      },
    ],
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Учителя</h1>
        <Space>
          
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={handleAdd}
            size="large"
          >
            Добавить учителя
          </Button>
        </Space>
      </div>

    <div className="mb-4 space-y-3 md:space-y-0 md:flex md:gap-4">
        <Input
          placeholder="Поиск по ФИО"
          prefix={<Search size={18} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
         className="w-full md:max-w-xs"
          size="large"
        />
        <Select
          placeholder="Фильтр по предмету"
          allowClear
          onChange={setSelectedSubject}
         className="w-full md:w-48"
          size="large"
          value={selectedSubject || undefined}
        >
          {uniqueSubjects.map((subject) => (
            <Select.Option key={subject} value={subject}>
              {subject}
            </Select.Option>
          ))}
        </Select>
        <Dropdown
            menu={columnSettingsMenu}
            placement="bottomRight"
            trigger={['click']}
            autoAdjustOverflow={false}
          >
            <Button
              icon={<Settings size={18} />}
              size="large"
               className="w-full md:w-auto"
            >
              Настройки таблицы
            </Button>
          </Dropdown>
      </div>

      <Table
       size="small"
        columns={visibleColumns}
        dataSource={filteredTeachers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total} учителей`,
        }}
      />

      <Modal
        title={editingTeacher ? 'Редактировать учителя' : 'Добавить учителя'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={500}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="full_name"
            label="ФИО"
            rules={[{ required: true, message: 'Введите ФИО' }]}
          >
            <Input placeholder="Иванов Иван Иванович" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Предмет"
            rules={[{ required: true, message: 'Введите предмет' }]}
          >
            <Input placeholder="Математика" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="teacher@example.com" />
          </Form.Item>

          <Form.Item name="phone" label="Телефон">
            <Input placeholder="+7 (900) 123-45-67" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}