import React, { useEffect, useState } from 'react';
import { Check, X, Clock, Calendar, User } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { leaveService } from '../../services/leave.service';
import { attendanceService } from '../../services/attendance.service';

const Approvals: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaves' | 'attendance'>('leaves');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaveRes, attRes] = await Promise.all([
        leaveService.getLeaveRequests(),
        attendanceService.getAttendanceRequests()
      ]);
      
      // Filter for pending requests if role allows
      // In a real app, the backend should handle this, but here we process based on status
      const pendingLeaves = (leaveRes.data.results || leaveRes.data).filter((r: any) => 
        r.status === 'pending' || r.status === 'manager_approved'
      );
      const pendingAtt = (attRes.data.results || attRes.data).filter((r: any) => 
        r.status === 'pending' || r.status === 'manager_approved'
      );
      
      setLeaveRequests(pendingLeaves);
      setAttendanceRequests(pendingAtt);
    } catch (error) {
      console.error('Failed to fetch approvals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (type: 'leave' | 'attendance', id: string, action: 'approve' | 'reject') => {
    try {
      if (type === 'leave') {
        if (action === 'approve') await leaveService.approveLeaveRequest(id);
        else await leaveService.rejectLeaveRequest(id);
      } else {
        if (action === 'approve') await attendanceService.approveAttendanceRequest(id);
        else await attendanceService.rejectAttendanceRequest(id);
      }
      fetchData();
    } catch (error) {
      console.error('Action failed', error);
      alert('Operation failed. Please try again.');
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Approval Dashboard</h1>
        <p className="text-slate-500 mt-1">Review and process requests from your team.</p>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        <button 
          onClick={() => setActiveTab('leaves')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'leaves' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Leave Requests ({leaveRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Attendance Corrections ({attendanceRequests.length})
        </button>
      </div>

      {activeTab === 'leaves' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             [1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>)
          ) : leaveRequests.length > 0 ? (
            leaveRequests.map((req) => (
              <Card key={req.id} className="border-l-4 border-l-primary-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.employee_name || 'Team Member'}</p>
                      <p className="text-xs text-slate-400 capitalize">{req.leave_type_name}</p>
                    </div>
                  </div>
                  <Badge variant={req.status === 'manager_approved' ? 'info' : 'warning'}>
                    {req.status === 'manager_approved' ? 'MGR Approved' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                    <span className="ml-2 font-bold text-slate-900">({req.total_days} Days)</span>
                  </div>
                  <div className="flex items-start text-xs text-slate-500 italic px-2 py-1.5 bg-slate-50 rounded-lg">
                    "{req.reason}"
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleAction('leave', req.id, 'approve')}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50"
                    onClick={() => handleAction('leave', req.id, 'reject')}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No pending leave requests to process.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             [1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>)
          ) : attendanceRequests.length > 0 ? (
            attendanceRequests.map((req) => (
              <Card key={req.id} className="border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.employee_name || 'Team Member'}</p>
                      <p className="text-xs text-slate-400">{new Date(req.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={req.status === 'manager_approved' ? 'info' : 'warning'}>
                    {req.status === 'manager_approved' ? 'MGR Approved' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-slate-50 rounded-xl text-[10px] font-bold">
                   <div className="text-emerald-600">IN: {req.morning_punch}</div>
                   <div className="text-amber-600">B-START: {req.break_start_punch}</div>
                   <div className="text-rose-600">OUT: {req.leaving_punch}</div>
                   <div className="text-primary-600">B-END: {req.break_end_punch}</div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleAction('attendance', req.id, 'approve')}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50"
                    onClick={() => handleAction('attendance', req.id, 'reject')}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No pending attendance corrections to process.</p>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default Approvals;
