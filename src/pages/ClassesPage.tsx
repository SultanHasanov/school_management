// components/ClassesPage.tsx
import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Tag,
  Dropdown,
  Checkbox,
  Select,
} from "antd";
import { Plus, Pencil, Trash2, Search, Settings } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps, CheckboxChangeEvent } from "antd";
import { observer } from "mobx-react-lite";
import { classStore, Class } from "../stores/class.store";
import { authStore } from "../stores/auth.store";

interface ColumnSettings {
  key: string;
  title: string;
  visible: boolean;
}

export const ClassesPage = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // Настройки колонок
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([
    { key: "name", title: "Название", visible: true },
    { key: "grade", title: "Класс", visible: true },
    { key: "actions", title: "Действия", visible: true },
  ]);

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("classColumnsSettings");
    if (savedSettings) {
      setColumnSettings(JSON.parse(savedSettings));
    }
    fetchClasses();
  }, []);

  // Сохранение настроек в localStorage
  useEffect(() => {
    localStorage.setItem(
      "classColumnsSettings",
      JSON.stringify(columnSettings)
    );
  }, [columnSettings]);

  const fetchClasses = async () => {
    try {
      await classStore.fetchClasses();
    } catch (error) {
      message.error("Ошибка загрузки классов");
    }
  };

  const handleAdd = () => {
    setEditingClass(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);

    // Извлекаем номер класса и букву из названия
    const grade = cls.grade;
    const letter = cls.name.replace(grade.toString(), "");

    form.setFieldsValue({
      grade: grade,
      letter: letter,
      academic_year: cls.academic_year,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await classStore.deleteClass(id);
      message.success("Класс удален");
    } catch (error) {
      message.error("Ошибка удаления класса");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const classData = {
        name: `${values.grade}${values.letter.toUpperCase()}`,
        grade: values.grade,
      };

      if (editingClass) {
        await classStore.updateClass({
          ...classData,
          id: editingClass.id,
        });
        message.success("Класс обновлен");
      } else {
        await classStore.createClass(classData);
        message.success("Класс добавлен");
      }

      // Принудительно обновляем данные с сервера
      await classStore.fetchClasses();

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(classStore.error || "Ошибка сохранения класса");
    }
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
  const resetColumnSettings = () => {
    const defaultSettings: ColumnSettings[] = [
      { key: "name", title: "Название", visible: true },
      { key: "grade", title: "Класс", visible: true },
      { key: "actions", title: "Действия", visible: true },
    ];
    setColumnSettings(defaultSettings);
    message.success("Настройки колонок сброшены");
  };

  const filteredClasses = classStore.filteredClasses.filter((cls) => {
    const matchesSearch =
      cls.name && cls.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesGrade = !selectedGrade || cls.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  // Базовые определения колонок
  const baseColumns: ColumnsType<Class> = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <Tag color="blue" className="text-base">
          {name}
        </Tag>
      ),
    },
    {
      title: "Класс",
      dataIndex: "grade",
      key: "grade",
      sorter: (a, b) => a.grade - b.grade,
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
            title="Удалить класс?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            overlayStyle={{
              position: "fixed", // предотвращает прыжки
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
        <h1 className="text-2xl font-bold text-gray-800">Классы</h1>
        {localStorage.getItem("role") !== "roo" && (
          <Space>
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={handleAdd}
              size="large"
              loading={classStore.isLoading}
            >
              Добавить класс
            </Button>
          </Space>
        )}
      </div>

      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:gap-4">
        <Input
          placeholder="Поиск по названию"
          prefix={<Search size={18} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full md:max-w-xs"
          size="large"
        />
        <Select
          placeholder="Фильтр по классу"
          allowClear
          onChange={setSelectedGrade}
          className="w-full md:w-48"
          size="large"
          value={selectedGrade || undefined}
        >
          {classStore.uniqueGrades.map((grade) => (
            <Select.Option key={grade} value={grade}>
              {grade} класс
            </Select.Option>
          ))}
        </Select>
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
        dataSource={filteredClasses}
        rowKey="id"
        loading={classStore.isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total} классов`,
        }}
      />

      <Modal
        title={editingClass ? "Редактировать класс" : "Добавить класс"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={400}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={classStore.isLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Класс и литер" required>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="grade"
                noStyle
                rules={[{ required: true, message: "Введите номер класса" }]}
              >
                <InputNumber
                  min={1}
                  max={11}
                  placeholder="9"
                  style={{ width: "50%" }}
                />
              </Form.Item>
              <Form.Item
                name="letter"
                noStyle
                rules={[
                  {
                    required: true,
                    message: "Введите литер класса",
                    pattern: /^[А-Яа-яA-Za-z]$/,
                  },
                ]}
              >
                <Input maxLength={1} placeholder="А" style={{ width: "50%" }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
