import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Drawer } from 'antd';
import {
  Users,
  GraduationCap,
  School,
  LayoutDashboard,
  LogOut,
  User,
  Building,
  Menu as MenuIcon,
} from 'lucide-react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { authStore } from '../stores/auth.store';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // На мобильных устройствах автоматически скрываем сайдбар
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleLogout = () => {
    authStore.logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: <Link to="/dashboard" onClick={() => setMobileDrawerOpen(false)}>Панель управления</Link>,
    },
    {
      key: '/students',
      icon: <GraduationCap size={20} />,
      label: <Link to="/students" onClick={() => setMobileDrawerOpen(false)}>Ученики</Link>,
    },
    {
      key: '/teachers',
      icon: <Users size={20} />,
      label: <Link to="/teachers" onClick={() => setMobileDrawerOpen(false)}>Учителя</Link>,
    },
    {
      key: '/classes',
      icon: <School size={20} />,
      label: <Link to="/classes" onClick={() => setMobileDrawerOpen(false)}>Классы</Link>,
    },
    ...(authStore.role === 'roo' ? [{
      key: '/schools',
      icon: <Building size={20} />,
      label: <Link to="/schools" onClick={() => setMobileDrawerOpen(false)}>Школы</Link>,
    }] : []),
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Выйти',
      onClick: handleLogout,
    },
  ];

  // Общий компонент меню
  const renderMenu = () => (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      className="border-r-0"
    />
  );

  return (
    <AntLayout className="min-h-screen">
      {/* Сайдбар для десктопа */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="bg-white shadow-md hidden md:block"
          width={240}
          collapsedWidth={80}
        >
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            {!collapsed ? (
              <h1 className="text-xl font-bold text-blue-600">
               {authStore.role === 'roo' ? "Админ" : "Школа"}
              </h1>
            ) : (
              <School className="text-blue-600" size={24} />
            )}
          </div>
          {renderMenu()}
        </Sider>
      )}

      {/* Drawer для мобильных устройств */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <School className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-blue-600">Школа</h1>
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={280}
        bodyStyle={{ padding: 0 }}
        className="md:hidden"
      >
        {renderMenu()}
      </Drawer>

      <AntLayout>
        <Header className="bg-white shadow-sm px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Кнопка меню для мобильных */}
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuIcon size={20} />}
                onClick={() => setMobileDrawerOpen(true)}
                className="flex items-center justify-center"
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center"
              />
            )}
            
            {/* Логотип для мобильных */}
            {isMobile && (
              <div className="flex items-center gap-2">
                <School className="text-blue-600" size={24} />
                <span className="font-bold text-blue-600 text-lg">Школа</span>
              </div>
            )}
          </div>

          <Dropdown 
            menu={{ items: userMenuItems }} 
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<User size={20} />}
              className="flex items-center gap-2"
            >
              {!isMobile && 'Профиль'}
            </Button>
          </Dropdown>
        </Header>
        
        <Content className="m-2  p-4  bg-white rounded-lg shadow-sm overflow-auto">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}