import { useEffect, useState } from "react";
import { Card, Statistic, Row, Col } from "antd";
import { Users, GraduationCap, School, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../stores/auth.store";

export function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    schools: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    try {
      const students = JSON.parse(localStorage.getItem("students") || "[]");
      const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
      const classes = JSON.parse(localStorage.getItem("classes") || "[]");
      const schools = JSON.parse(localStorage.getItem("schools") || "[]");

      setStats({
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        schools: schools.length,
      });
    } catch (error) {
      console.error("Ошибка при получении статистики:", error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Панель управления
      </h1>

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
        )}
      </Row>
    </div>
  );
}
