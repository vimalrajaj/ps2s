import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { departmentsApi, studentsApi, facultyApi, classesApi } from '../services/adminApi';
import AdminDepartments from './AdminDepartments';
import AdminStudents from './AdminStudents';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({
    departments: 0,
    students: 0,
    faculty: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [deptData, studentData, facultyData, classData] = await Promise.all([
        departmentsApi.getAll({ limit: 1 }),
        studentsApi.getAll({ limit: 1 }),
        facultyApi.getAll({ limit: 1 }),
        classesApi.getAll({ limit: 1 }),
      ]);

      setStats({
        departments: deptData.pagination.total,
        students: studentData.pagination.total,
        faculty: facultyData.pagination.total,
        classes: classData.pagination.total,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    if (user?.role === 'admin') {
      switch (activeView) {
        case 'departments':
          return <AdminDepartments />;
        case 'students':
          return <AdminStudents />;
        case 'overview':
        default:
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="Departments"
                count={loading ? '...' : stats.departments.toString()}
                description="Manage university departments"
                color="bg-blue-100 text-blue-800"
                onClick={() => setActiveView('departments')}
              />
              <DashboardCard
                title="Faculty"
                count={loading ? '...' : stats.faculty.toString()}
                description="Manage faculty members"
                color="bg-green-100 text-green-800"
                onClick={() => setActiveView('faculty')}
              />
              <DashboardCard
                title="Students"
                count={loading ? '...' : stats.students.toString()}
                description="Manage student records"
                color="bg-purple-100 text-purple-800"
                onClick={() => setActiveView('students')}
              />
              <DashboardCard
                title="Classes"
                count={loading ? '...' : stats.classes.toString()}
                description="Manage class sections"
                color="bg-yellow-100 text-yellow-800"
                onClick={() => setActiveView('classes')}
              />
            </div>
          );
      }
    }

    // Faculty and Student views remain the same for now
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Coming Soon"
          count="..."
          description="More features coming soon"
          color="bg-gray-100 text-gray-800"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'admin' && 'Admin Dashboard'}
                {user?.role === 'faculty' && 'Faculty Dashboard'}
                {user?.role === 'student' && 'Student Dashboard'}
              </h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {user?.role === 'admin' && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveView('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('departments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'departments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Departments
              </button>
              <button
                onClick={() => setActiveView('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Students
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Dashboard Card Component
interface DashboardCardProps {
  title: string;
  count: string;
  description: string;
  color: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, count, description, color, onClick }) => (
  <div 
    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} mr-4`}>
        <div className="text-2xl font-bold">{count}</div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  </div>
);



export default Dashboard;