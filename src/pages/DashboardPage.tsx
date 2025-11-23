import { useEffect, useState } from "react";
import { Card, Statistic, Row, Col, Alert, Spin } from "antd";
import { Users, GraduationCap, School, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../stores/auth.store";

interface ApiStats {
  schools: number;
  classes: number;
  students: number;
  teachers: number;
  staff_total: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    schools: 0,
    staff_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
       const token = authStore.token;
      const response = await fetch("https://api.achkhoy-obr.ru/stats/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // ВАЖНО: НЕ ставить Content-Type — иначе FormData сломается
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const data: ApiStats = await response.json();
      
      setStats({
        students: data.students,
        teachers: data.teachers,
        classes: data.classes,
        schools: data.schools,
        staff_total: data.staff_total,
      });
    } catch (error) {
      console.error("Ошибка при получении статистики:", error);
      setError("Не удалось загрузить статистику. Показаны локальные данные.");
      
      // Fallback на локальные данные при ошибке
      try {
        const students = JSON.parse(localStorage.getItem("students") || "[]");
        const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
        const classes = JSON.parse(localStorage.getItem("classes") || "[]");
        const schools = JSON.parse(localStorage.getItem("schools") || "[]");

        setStats(prev => ({
          ...prev,
          students: students.length,
          teachers: teachers.length,
          classes: classes.length,
          schools: schools.length,
        }));
      } catch (localError) {
        console.error("Ошибка при получении локальной статистики:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Загрузка статистики..." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Панель управления
      </h1>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          closable
          className="mb-4"
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="shadow-md cursor-pointer"
            onClick={() => navigate("/students")}
          >
            <Statistic
              title="Всего учеников"
              value={stats.students}
              prefix={<GraduationCap className="text-blue-600" size={24} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="shadow-md cursor-pointer"
            onClick={() => navigate("/teachers")}
          >
            <Statistic
              title="Всего учителей"
              value={stats.teachers}
              prefix={<Users className="text-green-600" size={24} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="shadow-md cursor-pointer"
            onClick={() => navigate("/classes")}
          >
            <Statistic
              title="Всего классов"
              value={stats.classes}
              prefix={<School className="text-orange-600" size={24} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>

        {authStore.role === "roo" && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                className="shadow-md cursor-pointer"
                onClick={() => navigate("/schools")}
              >
                <Statistic
                  title="Всего школ"
                  value={stats.schools}
                  prefix={<Building className="text-purple-600" size={24} />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            
            {/* Дополнительная карточка для общего персонала */}
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-md">
                <Statistic
                  title="Весь персонал"
                  value={stats.staff_total}
                  prefix={<Users className="text-red-600" size={24} />}
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
}