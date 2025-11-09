import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Dropdown,
  Checkbox,
  DatePicker,
} from "antd";
import { Plus, Pencil, Trash2, Search, Settings } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { studentStore, Student } from "../stores/student.store";
import { classStore } from "../stores/class.store";
import dayjs from "dayjs";

interface StudentWithClass extends Student {
  class?: {
    id: string;
    name: string;
    grade: number;
    academic_year: string;
  }| string;
}

interface ColumnSettings {
  key: string;
  title: string;
  visible: boolean;
}

export const StudentsPage = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithClass | null>(
    null
  );
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Настройки колонок
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([
    { key: "full_name", title: "ФИО", visible: true },
    { key: "class_id", title: "Класс", visible: true },
    { key: "phone", title: "Телефон", visible: true },
    { key: "birth_date", title: "Дата рождения", visible: true },
    { key: "gender", title: "Пол", visible: true },
    { key: "address", title: "Адрес", visible: true },
    { key: "note", title: "Примечание", visible: true },
    { key: "actions", title: "Действия", visible: true },
  ]);

  // Загрузка данных при инициализации
  useEffect(() => {
    const savedSettings = localStorage.getItem("studentColumnsSettings");
    if (savedSettings) {
      setColumnSettings(JSON.parse(savedSettings));
    }
    loadInitialData();
  }, []);

  // Сохранение настроек в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(
      "studentColumnsSettings",
      JSON.stringify(columnSettings)
    );
  }, [columnSettings]);

  const loadInitialData = async () => {
    try {
      await classStore.fetchClasses();
      await studentStore.fetchStudents();
    } catch (error) {
      message.error("Ошибка загрузки данных");
    }
  };

  const handleAdd = () => {
    setEditingStudent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (student: StudentWithClass) => {
    setEditingStudent(student);
    form.setFieldsValue({
      full_name: student.full_name,
      class_id: student.class_id,
      phone: student.phone,
      birth_date: student.birth_date ? dayjs(student.birth_date) : null,
      gender: student.gender,
      address: student.address,
      note: student.note,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await studentStore.deleteStudent(id);
      message.success("Ученик удален");
    } catch {
      message.error("Ошибка удаления ученика");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const studentData = {
        full_name: values.full_name,
        class_id: values.class_id,
        phone: values.phone,
        birth_date: values.birth_date
          ? values.birth_date.format("YYYY-MM-DD")
          : undefined,
        gender: values.gender,
        address: values.address,
        note: values.note,
        school_id: 1, // Укажите нужный school_id
      };

      if (editingStudent) {
        await studentStore.updateStudent({
          id: editingStudent.id,
          ...studentData,
        });
        message.success("Ученик обновлен");
      } else {
        await studentStore.createStudent(studentData);
        message.success("Ученик добавлен");
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка сохранения ученика"
      );
    }
  };

  // Обработчик изменения видимости колонок
  const handleColumnVisibilityChange = (
    key: string,
    visible: boolean,
    e: any
  ) => {
    e.stopPropagation();
    setColumnSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, visible } : setting
      )
    );
  };

  // Сброс настроек колонок к значениям по умолчанию
  const resetColumnSettings = () => {
    const defaultSettings: ColumnSettings[] = [
      { key: "full_name", title: "ФИО", visible: true },
      { key: "class_id", title: "Класс", visible: true },
      { key: "phone", title: "Телефон", visible: true },
      { key: "birth_date", title: "Дата рождения", visible: true },
      { key: "gender", title: "Пол", visible: true },
      { key: "address", title: "Адрес", visible: true },
      { key: "note", title: "Примечание", visible: true },
      { key: "actions", title: "Действия", visible: true },
    ];
    setColumnSettings(defaultSettings);
    message.success("Настройки колонок сброшены");
  };

  const filteredStudents = studentStore.studentsWithClasses.filter(
    (student) => {
      const matchesSearch = student.full_name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesClass =
        !selectedClass || student.class_id.toString() === selectedClass;
      return matchesSearch && matchesClass;
    }
  );

  // Базовые определения колонок
  const baseColumns: ColumnsType<StudentWithClass> = [
    {
      title: "ФИО",
      dataIndex: "full_name",
      key: "full_name",
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
  title: "Класс",
  dataIndex: "class",
  key: "class_id",
  render: (_, record) => {
    // Если class - строка, используем её, иначе берем name из объекта
    const classLabel =
      typeof record.class === "string" ? record.class : record.class?.name;

    return <Tag color="blue">{classLabel || "Не указан"}</Tag>;
  },
}
,
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Дата рождения",
      dataIndex: "birth_date",
      key: "birth_date",
      render: (date) => (date ? dayjs(date).format("DD.MM.YYYY") : "-"),
    },
    {
      title: "Пол",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => (gender === "male" ? "М" : gender === "female" ? "Ж" : "-"),
    },
    {
      title: "Адрес",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Примечание",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
    },
    {
      title: "Действия",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Pencil size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить ученика?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            overlayStyle={{
              position: "fixed",
            }}
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Фильтрация колонок на основе настроек
  const visibleColumns = baseColumns.filter(
    (column) =>
      columnSettings.find((setting) => setting.key === column.key)?.visible !==
      false
  );

  // Меню для настроек колонок
  const columnSettingsMenu: MenuProps = {
    items: [
      {
        key: "columns",
        label: "Видимые колонки",
        type: "group",
        children: columnSettings.map((setting) => ({
          key: setting.key,
          label: (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={setting.visible}
                onChange={(e) =>
                  handleColumnVisibilityChange(setting.key, e.target.checked, e)
                }
              >
                {setting.title}
              </Checkbox>
            </div>
          ),
        })),
      },
      {
        type: "divider",
      },
      {
        key: "reset",
        label: (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              type="link"
              onClick={resetColumnSettings}
              style={{ padding: 0 }}
            >
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
        <h1 className="text-2xl font-bold text-gray-800">Ученики</h1>
        <Space>
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={handleAdd}
            size="large"
          >
            Добавить ученика
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
          placeholder="Фильтр по классу"
          allowClear
          onChange={setSelectedClass}
          className="w-full md:w-48"
          size="large"
          value={selectedClass || undefined}
          loading={classStore.isLoading}
        >
          {classStore.filteredClasses.map((cls) => (
            <Select.Option key={cls.id} value={cls.id}>
              {cls.name}
            </Select.Option>
          ))}
        </Select>

        <Dropdown
          menu={columnSettingsMenu}
          placement="bottomRight"
          trigger={["click"]}
          autoAdjustOverflow={false}
        >
          <Button icon={<Settings size={18} />} size="large" className="w-full md:w-auto">
            Настройки таблицы
          </Button>
        </Dropdown>
      </div>

      <Table
        size="small"
        columns={visibleColumns}
        dataSource={filteredStudents}
        rowKey="id"
        loading={studentStore.isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total} учеников`,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingStudent ? "Редактировать ученика" : "Добавить ученика"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={studentStore.isLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="full_name"
            label="ФИО"
            rules={[{ required: true, message: "Введите ФИО" }]}
          >
            <Input placeholder="Иванов Иван Иванович" />
          </Form.Item>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name="class_id"
              label="Класс"
              rules={[{ required: true, message: "Выберите класс" }]}
              style={{ flex: 1 }}
            >
              <Select 
                placeholder="Выберите класс" 
                loading={classStore.isLoading}
              >
                {classStore.filteredClasses.map((cls) => (
                  <Select.Option key={cls.id} value={parseInt(cls.id)}>
                    {cls.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="gender" label="Пол" style={{ flex: 1 }}>
              <Select placeholder="Выберите пол">
                <Select.Option value="male">Мужской</Select.Option>
                <Select.Option value="female">Женский</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item name="birth_date" label="Дата рождения" style={{ flex: 1 }}>
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="phone" label="Телефон" style={{ flex: 1 }}>
              <Input placeholder="+7 (900) 123-45-67" />
            </Form.Item>
          </div>

          <Form.Item name="address" label="Адрес">
            <Input.TextArea placeholder="Введите адрес" rows={2} />
          </Form.Item>

          <Form.Item name="note" label="Примечание">
            <Input.TextArea placeholder="Введите примечание" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});