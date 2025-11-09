import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/auth.store'; // путь к вашему store

export const LoginPage = observer(() => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const onFinish = async (values: { email: string; password: string }) => {
  setLoading(true);
  try {
    await authStore.login(values);
    message.success('Вход выполнен успешно');
    navigate('/', { replace: true });
  } catch (err) {
    message.error(authStore.error || 'Неверный логин или пароль');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Система управления школой
          </h1>
          <p className="text-gray-600">Войдите в систему для продолжения</p>
          <p className="text-sm text-gray-500 mt-2">
            Логин: admin, Пароль: admin
          </p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{
            email: 'admin',
            password: 'admin'
          }}
        >
          <Form.Item
            name="email"
            label="Логин"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input placeholder="admin" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder="admin" prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              loading={loading || authStore.isLoading}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
});