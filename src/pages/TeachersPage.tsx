import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Tag,
  Dropdown,
  Checkbox,
  Select,
  InputNumber,
  message,
} from 'antd';
import { Plus, Pencil, Trash2, Search, Settings } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps, CheckboxChangeEvent } from 'antd';
import { teachersStore, Teacher, TeacherFormData } from '../stores/teachersStore';

interface ColumnSettings {
  key: string;
  title: string;
  visible: boolean;
}

export const TeachersPage = observer(() => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Настройки колонок
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([
    { key: 'full_name', title: 'ФИО', visible: true },
    { key: 'position', title: 'Должность', visible: true },
    { key: 'subject', title: 'Предмет', visible: true },
    { key: 'phone', title: 'Телефон', visible: true },
    { key: 'education', title: 'Образование', visible: false },
    { key: 'category', title: 'Категория', visible: false },
    { key: 'experience', title: 'Опыт', visible: false },
    { key: 'actions', title: 'Действия', visible: true },
  ]);

  // Загрузка данных и настроек
  useEffect(() => {
    teachersStore.loadTeachers();
    
    const savedSettings = localStorage.getItem('teacherColumnsSettings');
    if (savedSettings) {
      setColumnSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Сохранение настроек
  useEffect(() => {
    localStorage.setItem('teacherColumnsSettings', JSON.stringify(columnSettings));
  }, [columnSettings]);

  const handleAdd = () => {
    setEditingTeacher(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      full_name: teacher.full_name,
      position: teacher.position,
      subject: teacher.subject,
      phone: teacher.phone,
      education: teacher.education,
      category: teacher.category,
      ped_experience: teacher.ped_experience,
      total_experience: teacher.total_experience,
      work_start: teacher.work_start,
      note: teacher.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await teachersStore.deleteTeacher(id);
  };

  const handleSubmit = async (values: any) => {
    const teacherData: TeacherFormData = {
      full_name: values.full_name,
      phone: values.phone,
      position: values.position,
      subject: values.subject,
      education: values.education,
      category: values.category,
      ped_experience: values.ped_experience,
      total_experience: values.total_experience,
      work_start: values.work_start,
      note: values.note,
    };

    const success = editingTeacher
      ? await teachersStore.updateTeacher(editingTeacher.id, teacherData)
      : await teachersStore.addTeacher(teacherData);

    if (success) {
      setModalVisible(false);
      form.resetFields();
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
      { key: 'position', title: 'Должность', visible: true },
      { key: 'subject', title: 'Предмет', visible: true },
      { key: 'phone', title: 'Телефон', visible: true },
      { key: 'education', title: 'Образование', visible: false },
      { key: 'category', title: 'Категория', visible: false },
      { key: 'experience', title: 'Опыт', visible: false },
      { key: 'actions', title: 'Действия', visible: true },
    ];
    setColumnSettings(defaultSettings);
    message.success('Настройки колонок сброшены');
  };

  // Базовые определения колонок
  const baseColumns: ColumnsType<Teacher> = [
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      render: (position) => <Tag color="blue">{position}</Tag>,
    },
    {
      title: 'Предмет',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => <Tag color="green">{subject}</Tag>,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Образование',
      dataIndex: 'education',
      key: 'education',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? <Tag color="orange">{category}</Tag> : '-',
    },
    {
      title: 'Опыт',
      key: 'experience',
      render: (_, record) => (
        <div>
          {record.total_experience && `Общий: ${record.total_experience}л.`}
          {record.ped_experience && ` Пед.: ${record.ped_experience}л.`}
        </div>
      ),
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
              position: 'fixed'
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
        children: columnSettings?.map(setting => ({
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
          value={teachersStore.searchText}
          onChange={(e) => teachersStore.setSearchText(e.target.value)}
          className="w-full md:max-w-xs"
          size="large"
        />
        <Select
          placeholder="Фильтр по предмету"
          allowClear
          onChange={teachersStore.setSelectedSubject}
          className="w-full md:w-48"
          size="large"
          value={teachersStore.selectedSubject || undefined}
        >
          {teachersStore.uniqueSubjects?.map((subject) => (
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
        dataSource={teachersStore.filteredTeachers}
        rowKey="id"
        loading={teachersStore.loading}
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
        width={600}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="full_name"
              label="ФИО"
              rules={[{ required: true, message: 'Введите ФИО' }]}
            >
              <Input placeholder="Иванов Иван Иванович" />
            </Form.Item>

            <Form.Item
              name="position"
              label="Должность"
              rules={[{ required: true, message: 'Введите должность' }]}
            >
              <Input placeholder="Учитель математики" />
            </Form.Item>

            <Form.Item
              name="subject"
              label="Предмет"
              rules={[{ required: true, message: 'Введите предмет' }]}
            >
              <Input placeholder="Математика" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Телефон"
              rules={[{ required: true, message: 'Введите телефон' }]}
            >
              <Input placeholder="+7 (900) 123-45-67" />
            </Form.Item>

            <Form.Item name="education" label="Образование">
              <Input placeholder="Высшее педагогическое" />
            </Form.Item>

            <Form.Item name="category" label="Категория">
              <Input placeholder="Высшая категория" />
            </Form.Item>

            <Form.Item name="total_experience" label="Общий стаж (лет)">
              <InputNumber min={0} className="w-full" placeholder="0" />
            </Form.Item>

            <Form.Item name="ped_experience" label="Педагогический стаж (лет)">
              <InputNumber min={0} className="w-full" placeholder="0" />
            </Form.Item>
          </div>

          <Form.Item name="work_start" label="Дата начала работы">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="note" label="Примечания">
            <Input.TextArea rows={3} placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});