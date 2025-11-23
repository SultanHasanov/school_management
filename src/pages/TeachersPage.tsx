import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
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
  InputNumber,
  message,
  Upload,
} from "antd";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Settings,
  Download,
  Upload as UploadIcon,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps, CheckboxChangeEvent } from "antd";
import {
  teachersStore,
  Teacher,
  TeacherFormData,
  TeacherFilters,
} from "../stores/teachersStore";
import { authStore } from "../stores/auth.store";
import dayjs from "dayjs";

interface ColumnSettings {
  key: string;
  title: string;
  visible: boolean;
}

export const TeachersPage = observer(() => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [filters, setFilters] = useState<TeacherFilters>({});
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [educationFilter, setEducationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pedExperienceFilter, setPedExperienceFilter] = useState<number | null>(
    null
  );
  const [totalExperienceFilter, setTotalExperienceFilter] = useState<
    number | null
  >(null);
  // Настройки колонок
// Настройки колонок
const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([
  { key: "full_name", title: "ФИО", visible: true },
  { key: "position", title: "Должность", visible: true },
  { key: "subject", title: "Предмет", visible: true },
  { key: "phone", title: "Телефон", visible: true },
  { key: "education", title: "Образование", visible: false },
  { key: "category", title: "Категория", visible: false },
  { key: "ped_experience", title: "Пед. стаж", visible: false },
  { key: "total_experience", title: "Общий стаж", visible: false },
  { key: "work_start", title: "Дата начала работы", visible: false },
  { key: "school_id", title: "ID школы", visible: false },
  { key: "actions", title: "Действия", visible: true },
]);
  // Загрузка данных и настроек
  useEffect(() => {
    teachersStore.loadTeachers(filters); // передаем фильтры

    const savedSettings = localStorage.getItem("teacherColumnsSettings");
    if (savedSettings) {
      setColumnSettings(JSON.parse(savedSettings));
    }
  }, [filters]); // добавляем filters в зависимости

  // Сохранение настроек
  useEffect(() => {
    localStorage.setItem(
      "teacherColumnsSettings",
      JSON.stringify(columnSettings)
    );
  }, [columnSettings]);

  const applyFilters = () => {
    const newFilters: TeacherFilters = {};

    if (nameFilter) newFilters.full_name = nameFilter;
    if (phoneFilter) newFilters.phone = phoneFilter;
    if (positionFilter) newFilters.position = positionFilter;
    if (subjectFilter) newFilters.subject = subjectFilter;
    if (educationFilter) newFilters.education = educationFilter;
    if (categoryFilter) newFilters.category = categoryFilter;
    if (pedExperienceFilter) newFilters.ped_experience = pedExperienceFilter;
    if (totalExperienceFilter)
      newFilters.total_experience = totalExperienceFilter;

    setFilters(newFilters);
    teachersStore.loadTeachers(newFilters);
  };

  // Функция сброса фильтров
  const resetFilters = () => {
    setNameFilter("");
    setPhoneFilter("");
    setPositionFilter("");
    setSubjectFilter("");
    setEducationFilter("");
    setCategoryFilter("");
    setPedExperienceFilter(null);
    setTotalExperienceFilter(null);

    const emptyFilters = {};
    setFilters(emptyFilters);
    teachersStore.loadTeachers(emptyFilters);
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

  // Функция для импорта учителей
  const handleImport = async (file: File) => {
    setImportLoading(true);
    try {
      const result = await teachersStore.importTeachers(file);
      if (result.imported !== undefined) {
        message.success(`Успешно импортировано ${result.imported} учителей`);
      } else if (result.message) {
        message.success(result.message);
      } else {
        message.success("Импорт выполнен успешно");
      }
    } catch (error) {
      message.error("Ошибка импорта учителей");
    } finally {
      setImportLoading(false);
    }
    return false; // предотвращает автоматическую загрузку
  };

  // Обработчик изменения видимости колонок
  const handleColumnVisibilityChange = (
    key: string,
    visible: boolean,
    e: CheckboxChangeEvent
  ) => {
    e.stopPropagation();
    setColumnSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, visible } : setting
      )
    );
  };

  // Сброс настроек колонок
// Сброс настроек колонок
const resetColumnSettings = () => {
  const defaultSettings: ColumnSettings[] = [
    { key: "full_name", title: "ФИО", visible: true },
    { key: "position", title: "Должность", visible: true },
    { key: "subject", title: "Предмет", visible: true },
    { key: "phone", title: "Телефон", visible: true },
    { key: "education", title: "Образование", visible: false },
    { key: "category", title: "Категория", visible: false },
    { key: "ped_experience", title: "Пед. стаж", visible: false },
    { key: "total_experience", title: "Общий стаж", visible: false },
    { key: "work_start", title: "Дата начала работы", visible: false },
    { key: "school_id", title: "ID школы", visible: false },
    { key: "actions", title: "Действия", visible: true },
  ];
  setColumnSettings(defaultSettings);
  message.success("Настройки колонок сброшены");
};

  // Базовые определения колонок
// Базовые определения колонок
const baseColumns: ColumnsType<Teacher> = [
  {
    title: "ФИО",
    dataIndex: "full_name",
    key: "full_name",
    sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    fixed: 'left',
    width: 200,
  },
  {
    title: "Должность",
    dataIndex: "position",
    key: "position",
    render: (position) => <Tag color="blue">{position}</Tag>,
    sorter: (a, b) => (a.position || '').localeCompare(b.position || ''),
  },
  {
    title: "Предмет",
    dataIndex: "subject",
    key: "subject",
    render: (subject) => <Tag color="green">{subject}</Tag>,
    sorter: (a, b) => (a.subject || '').localeCompare(b.subject || ''),
  },
  {
    title: "Телефон",
    dataIndex: "phone",
    key: "phone",
    sorter: (a, b) => (a.phone || '').localeCompare(b.phone || ''),
  },
  {
    title: "Образование",
    dataIndex: "education",
    key: "education",
    sorter: (a, b) => (a.education || '').localeCompare(b.education || ''),
  },
  {
    title: "Категория",
    dataIndex: "category",
    key: "category",
    render: (category) =>
      category ? <Tag color="orange">{category}</Tag> : "-",
    sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
  },
  {
    title: "Пед. стаж",
    dataIndex: "ped_experience",
    key: "ped_experience",
    render: (experience) => experience ? `${experience} лет` : "-",
    sorter: (a, b) => (a.ped_experience || 0) - (b.ped_experience || 0),
    width: 120,
  },
  {
    title: "Общий стаж",
    dataIndex: "total_experience",
    key: "total_experience",
    render: (experience) => experience ? `${experience} лет` : "-",
    sorter: (a, b) => (a.total_experience || 0) - (b.total_experience || 0),
    width: 120,
  },
  {
    title: "Дата начала работы",
    dataIndex: "work_start",
    key: "work_start",
    render: (date) => date ? dayjs(date).format("DD.MM.YYYY") : "-",
    sorter: (a, b) => dayjs(a.work_start || '').unix() - dayjs(b.work_start || '').unix(),
    width: 150,
  },

  {
    title: "ID школы",
    dataIndex: "school_id",
    key: "school_id",
    render: (id) => id || "-",
    sorter: (a, b) => (a.school_id || 0) - (b.school_id || 0),
    width: 100,
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
          title="Удалить учителя?"
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
        <h1 className="text-2xl font-bold text-gray-800">Учителя</h1>
        {localStorage.getItem("role") !== "roo" && (
          <Space>
            <Button
              icon={<Download size={18} />}
              onClick={async () => {
                try {
                  const token = authStore.token;
                  const response = await fetch(
                    "https://api.achkhoy-obr.ru/staff/import/template",
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "teachers_template.xlsx";
                  document.body.appendChild(link);
                  link.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(link);
                } catch (error) {
                  message.error("Ошибка при скачивании шаблона");
                }
              }}
              size="large"
            >
              Скачать шаблон
            </Button>

            <Upload
              accept=".xlsx,.xls,.csv"
              beforeUpload={handleImport}
              showUploadList={false}
            >
              <Button
                icon={<UploadIcon size={18} />}
                loading={importLoading}
                size="large"
              >
                Импорт учителей
              </Button>
            </Upload>

            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={handleAdd}
              size="large"
            >
              Добавить учителя
            </Button>
          </Space>
        )}
      </div>

      {/* Остальной код без изменений */}
      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:gap-4 md:flex-wrap">
        {/* Существующие фильтры */}
        <Input
          placeholder="Поиск по ФИО"
          prefix={<Search size={18} />}
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-full md:max-w-xs"
          size="large"
        />

        <Input
          placeholder="Телефон"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          className="w-full md:w-32"
          size="large"
        />

        <Input
          placeholder="Должность"
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="w-full md:w-40"
          size="large"
        />

        <Input
          placeholder="Предмет"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="w-full md:w-40"
          size="large"
        />

        <Input
          placeholder="Образование"
          value={educationFilter}
          onChange={(e) => setEducationFilter(e.target.value)}
          className="w-full md:w-48"
          size="large"
        />

        <Input
          placeholder="Категория"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:w-40"
          size="large"
        />

        <Input
          placeholder="Пед. стаж от"
          type="number"
          value={pedExperienceFilter || ""}
          onChange={(e) =>
            setPedExperienceFilter(
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="w-full md:w-28"
          size="large"
        />

        <Input
          placeholder="Общ. стаж от"
          type="number"
          value={totalExperienceFilter || ""}
          onChange={(e) =>
            setTotalExperienceFilter(
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="w-full md:w-28"
          size="large"
        />

        {/* Кнопки применения и сброса */}
        <Button type="primary" onClick={applyFilters} size="large">
          Применить
        </Button>

        <Button onClick={resetFilters} size="large">
          Сбросить
        </Button>

        {/* Существующие элементы... */}
        <Dropdown
          menu={columnSettingsMenu}
          placement="bottomRight"
          trigger={["click"]}
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
        dataSource={teachersStore.teachers}
        rowKey="id"
        loading={teachersStore.loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total} учителей`,
        }}
        scroll={{ x: 1500 }}
      />

      <Modal
        title={editingTeacher ? "Редактировать учителя" : "Добавить учителя"}
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
              rules={[{ required: true, message: "Введите ФИО" }]}
            >
              <Input placeholder="Иванов Иван Иванович" />
            </Form.Item>

            <Form.Item
              name="position"
              label="Должность"
              rules={[{ required: true, message: "Введите должность" }]}
            >
              <Input placeholder="Учитель математики" />
            </Form.Item>

            <Form.Item
              name="subject"
              label="Предмет"
              rules={[{ required: true, message: "Введите предмет" }]}
            >
              <Input placeholder="Математика" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Телефон"
              rules={[{ required: true, message: "Введите телефон" }]}
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
