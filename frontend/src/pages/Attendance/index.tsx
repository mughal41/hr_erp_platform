import React, { useEffect, useState } from 'react';
import { Clock, Download, Info, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { attendanceService } from '../../services/attendance.service';

const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await attendanceService.getAttendance();
        const data = response.data.results || response.data;
        setRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch attendance', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
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
      // Refresh
      const response = await attendanceService.getAttendance();
      const data = response.data.results || response.data;
      setRecords(Array.isArray(data) ? data : []);
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
        <Button variant="secondary" className="flex items-center">
          <Download className="h-4 w-4 mr-2" /> Export Logs
        </Button>
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

          <Card title="Attendance Summary" subtitle="This Month">
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />
                      <span className="text-sm font-medium text-slate-600">Present</span>
                   </div>
                   <span className="text-sm font-bold text-slate-900">20 Days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="text-sm font-medium text-slate-600">Late Arrivals</span>
                   </div>
                   <span className="text-sm font-bold text-slate-900">2 Days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-rose-500 mr-2" />
                      <span className="text-sm font-medium text-slate-600">Absent</span>
                   </div>
                   <span className="text-sm font-bold text-slate-900">1 Day</span>
                </div>
             </div>
          </Card>
        </div>

        {/* Attendance Logs */}
        <div className="lg:col-span-2">
          <Card title="Recent Logs" noPadding>
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
                    ) : Array.isArray(records) && records.length > 0 ? (
                      records.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">{rec.date ? new Date(rec.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-sm">
                               <span className="text-emerald-600 font-medium">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                               <span className="text-slate-300">/</span>
                               <span className="text-slate-600 font-medium">{rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600 font-medium">{rec.total_worked || rec.total_worked_hours || '0h 00m'}</p>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(rec.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No attendance logs found.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Attendance;
