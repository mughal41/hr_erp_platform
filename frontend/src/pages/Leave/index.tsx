import React, { useEffect, useState } from 'react';
import { Calendar, Filter, Plus, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LeaveForm from '../../components/features/LeaveForm';
import { leaveService } from '../../services/leave.service';

const Leave: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveRequests();
      setRequests(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch leave requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        setLoading(true);
        const [reqRes, balRes] = await Promise.all([
          leaveService.getLeaveRequests(),
          leaveService.getLeaveBalances()
        ]);
        setRequests(reqRes.data.results || reqRes.data);
        setBalances(balRes.data.results || balRes.data);
      } catch (error) {
        console.error('Failed to fetch leave data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="error">Rejected</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'manager_approved': return <Badge variant="info">Mgr Approved</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-slate-500 mt-1">Submit requests, track balances, and manage time-offs.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => alert('Feature coming soon!')}>Export</Button>
          <Button onClick={() => setIsModalOpen(true)}>New Request</Button>
        </div>
      </div>

      {/* Leave Balance Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
           [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>)
        ) : balances.length > 0 ? (
          balances.map((bal, i) => (
            <div key={i} className="card-minimal p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{bal.leave_type_name || 'Paid Leave'}</p>
              <h3 className="text-2xl font-bold text-slate-900">{(bal.total_allocation - bal.used).toFixed(1)} <span className="text-sm font-medium text-slate-400">Days</span></h3>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-primary-500 transition-all duration-500" 
                   style={{ width: `${(bal.used / bal.total_allocation) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">USED: {bal.used} / {bal.total_allocation}</p>
            </div>
          ))
        ) : (
           <div className="lg:col-span-4 card-minimal p-8 text-center text-slate-400">No leave balances found for current year.</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Requests Table */}
        <Card title="My Requests" className="lg:col-span-2" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                   <th className="px-6 py-4">Leave Type</th>
                   <th className="px-6 py-4">Period</th>
                   <th className="px-6 py-4">Days</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading requests...</td></tr>
                 ) : requests.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No requests submitted yet.</td></tr>
                 ) : (
                    requests.map((req, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{req.leave_type_name || 'Sick Leave'}</td>
                        <td className="px-6 py-4">
                           <p className="text-sm text-slate-600">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</p>
                           <p className="text-[10px] text-slate-400">{req.start_day_type} - {req.end_day_type}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold">{req.total_days}</td>
                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                        <td className="px-6 py-4 text-right">
                           {req.status === 'pending' && <Button variant="ghost" size="sm" className="text-rose-500">Cancel</Button>}
                        </td>
                      </tr>
                    ))
                 )}
               </tbody>
            </table>
          </div>
        </Card>

        {/* Info Card */}
        <div className="space-y-6">
          <Card title="Quick Info">
            <div className="space-y-4">
               <div className="flex gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg shrink-0">
                    <AlertCircle className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Planning a leave?</p>
                    <p className="text-xs text-slate-500 mt-0.5">Please submit requests at least 3 days in advance for proper planning.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg shrink-0">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Annual Quota</p>
                    <p className="text-xs text-slate-500 mt-0.5">Your total annual leave quota is reset on January 1st every year.</p>
                  </div>
               </div>
            </div>
          </Card>
          
          <Card className="bg-primary-600 text-white border-none shadow-strong">
             <h4 className="font-bold text-lg mb-2">Need Help?</h4>
             <p className="text-sm text-primary-100 mb-6">If you have questions about leave policies or balances, contact HR.</p>
             <Button variant="secondary" className="w-full bg-white text-primary-600 border-none hover:bg-primary-50">View Policy</Button>
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Submit Time Off Request"
      >
        <LeaveForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchLeaves();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default Leave;
