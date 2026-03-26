import React, { useEffect, useState } from 'react';
import { Users, CalendarCheck, Clock, FileText, ArrowRight } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmployeeForm from '../../components/features/EmployeeForm';
import LeaveForm from '../../components/features/LeaveForm';
import { attendanceService } from '../../services/attendance.service';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'employee' | 'leave' | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const response = await attendanceService.getAnalytics();
      setStats(response.data || {});
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClockIn = async () => {
    try {
      await attendanceService.clockIn({ method: 'web' });
      alert('Successfully clocked in!');
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Clock in failed.');
    }
  };

  const metricCards = [
    { 
      label: 'Total Employees', 
      value: stats?.today?.present + stats?.today?.absent || 0, 
      icon: Users, 
      color: 'bg-blue-50 text-blue-600',
      change: '+2 this month'
    },
    { 
      label: 'Present Today', 
      value: stats?.today?.present || 0, 
      icon: CalendarCheck, 
      color: 'bg-emerald-50 text-emerald-600',
      change: '92% attendance'
    },
    { 
      label: 'On Leave', 
      value: stats?.today?.absent || 0, 
      icon: FileText, 
      color: 'bg-amber-50 text-amber-600',
      change: '3 pending approval'
    },
    { 
      label: 'Average Hours', 
      value: `${stats?.average_working_hours || 0}h`, 
      icon: Clock, 
      color: 'bg-primary-50 text-primary-600',
      change: 'Consistent'
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Real-time HR metrics and workforce insights.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => alert('Download feature coming soon!')}>Download Report</Button>
          <Button onClick={() => setActiveModal('employee')}>Add Employee</Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, i) => (
          <div key={i} className="card-minimal p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : card.value}</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">{card.change}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Attendance Trends */}
        <Card title="Attendance Trends" className="lg:col-span-2" extra={<Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>}>
           <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
             <div className="text-center">
                <CalendarCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">Visualization: Last 30 Days Stats</p>
                <p className="text-xs text-slate-300 mt-1">Charts will render based on attendance data</p>
             </div>
           </div>
        </Card>

        {/* Quick Actions / Recent Activity */}
        <Card title="Quick Actions">
          <div className="space-y-3">
            <button 
              onClick={handleClockIn}
              className="w-full p-4 text-left border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group"
            >
              <p className="font-semibold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">Clock In System</p>
              <p className="text-xs text-slate-500 mt-0.5">Mark your presence for today</p>
            </button>
            <button 
              onClick={() => setActiveModal('leave')}
              className="w-full p-4 text-left border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group"
            >
              <p className="font-semibold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">Request Leave</p>
              <p className="text-xs text-slate-500 mt-0.5">Submit new time-off request</p>
            </button>
            <button 
              onClick={() => navigate('/payroll')}
              className="w-full p-4 text-left border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group"
            >
              <p className="font-semibold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">View Payslip</p>
              <p className="text-xs text-slate-500 mt-0.5">Access your latest salary details</p>
            </button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'employee'} 
        onClose={() => setActiveModal(null)}
        title="Register New Employee"
        size="lg"
      >
        <EmployeeForm 
          onSuccess={() => {
            setActiveModal(null);
            fetchStats();
          }} 
          onCancel={() => setActiveModal(null)} 
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'leave'} 
        onClose={() => setActiveModal(null)}
        title="Submit Leave Request"
      >
        <LeaveForm 
          onSuccess={() => {
            setActiveModal(null);
            alert('Leave request submitted successfully!');
          }} 
          onCancel={() => setActiveModal(null)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default Dashboard;
