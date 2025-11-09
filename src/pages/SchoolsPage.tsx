// pages/SchoolsPage.tsx
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
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
} from "antd";
import {
  Plus,
  Pencil,
  Trash2,
  Building,
  Copy,
  EyeOff,
  Eye,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { schoolsStore, School } from "../stores/schools.store";

export const SchoolsPage = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<string, boolean>
  >({});

  const [form] = Form.useForm();

  const togglePasswordVisibility = (schoolId: string) => {
  setPasswordVisibility(prev => ({
    ...prev,
    [schoolId]: !prev[schoolId]
  }));
};

  useEffect(() => {
    schoolsStore.fetchSchools();
  }, []);

  const handleAdd = () => {
    setEditingSchool(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    form.setFieldsValue({
      name: school.name,
      director: school.director,
      email: school.user?.email,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await schoolsStore.deleteSchool(id);
      message.success("Школа удалена");
    } catch {
      message.error(schoolsStore.error || "Ошибка удаления школы");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingSchool) {
        await schoolsStore.updateSchool(editingSchool.id, {
          name: values.name,
          director: values.director,
          email: values.email,
        });
        message.success("Школа обновлена");
      } else {
        await schoolsStore.createSchool({
          director: values.director,
          email: values.email,
          name: values.name,
        });
        message.success("Школа добавлена");
      }
      setModalVisible(false);
    schoolsStore.fetchSchools();

      form.resetFields();
    } catch {
      message.error(schoolsStore.error || "Ошибка сохранения школы");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("Пароль скопирован в буфер обмена");
      })
      .catch(() => {
        message.error("Не удалось скопировать пароль");
      });
  };

  // Получаем пароль из user объекта
  const getPassword = (school: School) => {
    return school.user?.password || "";
  };

  const columns: ColumnsType<School> = [
    {
      title: "Название школы",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <div className="flex items-center gap-2">
          <Building size={16} className="text-blue-600" />
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: "Директор",
      dataIndex: "director",
      key: "director",
      sorter: (a, b) => a.director.localeCompare(b.director),
    },
    {
      title: "Email",
      key: "email",
      render: (_, record) => (
        <Tag color="blue">
          <a href={`mailto:${record.user?.email}`}>{record.user?.email}</a>
        </Tag>
      ),
    },
   {
  title: "Пароль",
  key: "password",
  render: (_, record) => {
    const password = getPassword(record);
    const isVisible = passwordVisibility[record.id] || false;

    return (
      <div className="flex items-center gap-2">
        <span className="font-mono">
          {isVisible ? password : "•".repeat(8)}
        </span>
        <Button
          type="text"
          size="small"
          icon={isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={() => togglePasswordVisibility(record.id)}
          title={isVisible ? "Скрыть пароль" : "Показать пароль"}
        />
        <Button
          type="text"
          size="small"
          icon={<Copy size={14} />}
          onClick={() => copyToClipboard(password)}
          title="Копировать пароль"
        />
      </div>
    );
  },
},
    {
      title: "Классы",
      dataIndex: "class_count",
      key: "class_count",
      align: "center",
      render: (count) => (
        <Tag color={count > 0 ? "green" : "default"}>{count || 0}</Tag>
      ),
    },
    {
      title: "Ученики",
      dataIndex: "student_count",
      key: "student_count",
      align: "center",
      render: (count) => (
        <Tag color={count > 0 ? "blue" : "default"}>{count || 0}</Tag>
      ),
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
            title="Удалить школу?"
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

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Школы</h1>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          size="large"
          loading={schoolsStore.isLoading}
        >
          Добавить школу
        </Button>
      </div>

      <Table
        size="small"
        columns={columns}
        dataSource={schoolsStore.schools}
        rowKey="id"
        loading={schoolsStore.isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total} школ`,
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingSchool ? "Редактировать школу" : "Добавить школу"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={500}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={schoolsStore.isLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Название школы"
            rules={[
              { required: true, message: "Введите название школы" },
              {
                min: 3,
                message: "Название должно содержать минимум 3 символа",
              },
            ]}
          >
            <Input placeholder="МБОУ СОШ №1 г. Москва" />
          </Form.Item>

          <Form.Item
            name="director"
            label="ФИО директора"
            rules={[
              { required: true, message: "Введите ФИО директора" },
              {
                pattern: /^[а-яА-ЯёЁ\s]+$/,
                message: "ФИО должно содержать только русские буквы",
              },
            ]}
          >
            <Input placeholder="Иванов Иван Иванович" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email школы"
            rules={[
              { required: true, message: "Введите email школы" },
              { type: "email", message: "Введите корректный email" },
            ]}
          >
            <Input placeholder="school@example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
