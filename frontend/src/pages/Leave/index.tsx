import React, { useEffect, useState } from 'react';
// Icons not needed after redesign
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
  const [modalMode, setModalMode] = useState<'create'|'edit'|'view'|'delete'>('create');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

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

  const handleOpenModal = (mode: 'create'|'edit'|'view'|'delete', req: any = null) => {
     setModalMode(mode);
     setSelectedRequest(req);
     setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedRequest) return;
    try {
      await leaveService.deleteLeaveRequest(selectedRequest.id);
      setIsModalOpen(false);
      fetchLeaves();
    } catch (error) {
      console.error('Failed to delete leave request', error);
      alert('Cannot delete this leave request.');
    }
  };

  const handleDeleteRequest = (req: any) => {
     handleOpenModal('delete', req);
  };

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
          <Button onClick={() => handleOpenModal('create')}>New Request</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Leave Balances */}
        <div className="space-y-6">
          <Card title="Leave Allowances">
            <div className="space-y-6">
              {loading ? (
                 [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100/50 rounded-xl animate-pulse"></div>)
              ) : balances.length > 0 ? (
                balances.map((bal, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{bal.leave_type_name || 'Paid Leave'}</span>
                       <div className="text-right">
                         <span className="text-lg font-bold text-slate-900">{parseFloat(bal.available).toFixed(1)}</span>
                         <span className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-widest">Left</span>
                       </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                         style={{ width: `${(parseFloat(bal.used) / parseFloat(bal.opening_balance)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-bold tracking-wider">
                       <span>USED {bal.used}</span>
                       <span>QUOTA {bal.opening_balance}</span>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-center text-slate-400 py-6 text-sm">No leave balances found for current year.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Content: Leave Requests Table */}
        <Card title="Leave Requests Workflow" className="lg:col-span-2" noPadding>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                   <th className="px-6 py-4 border-b border-slate-100">Leave Type</th>
                   <th className="px-6 py-4 border-b border-slate-100">Period</th>
                   <th className="px-6 py-4 border-b border-slate-100">Days</th>
                   <th className="px-6 py-4 border-b border-slate-100">Status</th>
                   <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
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
                           <p className="text-sm font-semibold text-slate-600">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</p>
                           <p className="text-xs font-medium text-slate-400 mt-0.5">{req.start_day_type} - {req.end_day_type}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold">{parseFloat(req.total_days).toFixed(1)}</td>
                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 text-slate-400">
                              <button onClick={() => handleOpenModal('view', req)} className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="View details">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              {req.status === 'pending' && (
                                 <>
                                    <button onClick={() => handleOpenModal('edit', req)} className="p-1 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit request">
                                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                    </button>
                                    <button onClick={() => handleDeleteRequest(req)} className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete request">
                                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                 </>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))
                 )}
               </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'delete' ? "Confirm Delete" : modalMode === 'view' ? "View Leave Request" : modalMode === 'edit' ? "Edit Leave Request" : "Submit Time Off Request"}
      >
        {modalMode === 'delete' ? (
           <div className="space-y-6">
              <p className="text-slate-600">Are you sure you want to delete this leave request? This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-rose-500 hover:bg-rose-600 border-rose-500" onClick={executeDelete}>Delete Request</Button>
              </div>
           </div>
        ) : (
          <LeaveForm 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchLeaves();
            }} 
            onCancel={() => setIsModalOpen(false)} 
            editData={selectedRequest}
            isViewOnly={modalMode === 'view'}
          />
        )}
      </Modal>
    </MainLayout>
  );
};

export default Leave;
