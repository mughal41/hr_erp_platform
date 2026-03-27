import React, { useEffect, useState } from 'react';
import { Clock, Download } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { attendanceService } from '../../services/attendance.service';

import Modal from '../../components/common/Modal';
import AttendanceRequestForm from '../../components/features/AttendanceRequestForm';

const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'requests'>('logs');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, reqRes] = await Promise.all([
        attendanceService.getAttendance(),
        attendanceService.getAttendanceRequests()
      ]);
      setRecords(recRes.data.results || recRes.data);
      setRequests(reqRes.data.results || reqRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClockAction = async (action: 'in' | 'out') => {
    try {
      if (action === 'in') {
        await attendanceService.clockIn({ 
          check_in_method: 'web',
          check_in_location: 'Office (Verified)'
        });
      } else {
        await attendanceService.clockOut({ 
          check_out_method: 'web'
        });
      }
      fetchData();
    } catch (error: any) {
       console.error('Clock action failed', error);
       alert(error.response?.data?.message || 'Operation failed. Please check your connection or profile.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge variant="success">Present</Badge>;
      case 'late': return <Badge variant="warning">Late</Badge>;
      case 'absent': return <Badge variant="error">Absent</Badge>;
      case 'half_day': return <Badge variant="info">Half Day</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="error">Rejected</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Time & Attendance</h1>
          <p className="text-slate-500 mt-1">Track your working hours and attendance logs.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Request Correction
          </Button>
          <Button variant="secondary" className="flex items-center">
            <Download className="h-4 w-4 mr-2" /> Export Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clock In/Out Widget */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center bg-white border-2 border-primary-50">
            <div className="py-8">
              <div className="h-16 w-16 bg-primary-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm font-medium text-slate-400">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/50 border-t border-slate-100">
              <Button onClick={() => handleClockAction('in')} className="w-full">Clock In</Button>
              <Button variant="secondary" onClick={() => handleClockAction('out')} className="w-full">Clock Out</Button>
            </div>
          </Card>
          
          <Card title="Summary" subtitle="Current Month">
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Working Days</span>
                <span className="font-bold text-slate-900">22</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Present</span>
                <span className="font-bold text-emerald-600">20</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Logs and Requests */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4 w-fit">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Daily Logs
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              My Requests
            </button>
          </div>

          {activeTab === 'logs' ? (
            <Card title="Attendance Logs" noPadding>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">In / Out</th>
                        <th className="px-6 py-4">Work Duration</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading logs...</td></tr>
                      ) : records.length > 0 ? (
                        records.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                              {new Date(rec.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2 text-sm text-slate-600">
                                 <span className="font-medium">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                 <span className="text-slate-300">/</span>
                                 <span className="font-medium">{rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                              {rec.total_worked || '0h 00m'}
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(rec.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </Card>
          ) : (
            <Card title="Requested Corrections" noPadding>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Requested Date</th>
                        <th className="px-6 py-4">Proposed Punches</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">Loading requests...</td></tr>
                      ) : requests.length > 0 ? (
                        requests.map((req, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-900">{new Date(req.date).toLocaleDateString()}</p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{req.reason}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold">
                                <div className="text-emerald-600">IN: {req.morning_punch}</div>
                                <div className="text-amber-600">B-START: {req.break_start_punch}</div>
                                <div className="text-rose-600">OUT: {req.leaving_punch}</div>
                                <div className="text-primary-600">B-END: {req.break_end_punch}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(req.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">No requests found.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </Card>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Request Attendance Correction"
      >
        <AttendanceRequestForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default Attendance;
