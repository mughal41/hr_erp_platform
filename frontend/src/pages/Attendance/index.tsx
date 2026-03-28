import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Download, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react';
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
  const [modalMode, setModalMode] = useState<'create'|'edit'|'view'|'delete'>('create');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

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

  useEffect(() => { fetchData(); }, []);

  const handleClockAction = async (action: 'in' | 'out') => {
    try {
      if (action === 'in') {
        await attendanceService.clockIn({ check_in_method: 'web', check_in_location: 'Office (Verified)' });
      } else {
        await attendanceService.clockOut({ check_out_method: 'web' });
      }
      fetchData();
    } catch (error: any) {
       console.error('Clock action failed', error);
       alert(error.response?.data?.message || 'Operation failed.');
    }
  };

  const handleOpenModal = (mode: 'create'|'edit'|'view'|'delete', req: any = null) => {
     setModalMode(mode);
     setSelectedRequest(req);
     setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedRequest) return;
    try {
      await attendanceService.deleteAttendanceRequest(selectedRequest.id);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to delete request', error);
      alert('Cannot delete this request.');
    }
  };

  const handleDeleteRequest = (req: any) => { handleOpenModal('delete', req); };

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

  const formatDuration = (dStr: string) => {
    if (!dStr || dStr === '00:00:00') return '—';
    const match = dStr.match(/(\d{2}):(\d{2}):\d{2}/);
    if (match) {
        const hrs = parseInt(match[1]);
        const mins = parseInt(match[2]);
        if (hrs === 0 && mins === 0) return '—';
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    }
    return dStr;
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '—';
    // timeStr could be "HH:MM:SS" or ISO datetime
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
    return timeStr;
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthRecords = useMemo(() => {
    return records
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, currentMonth]);

  const analytics = useMemo(() => {
    let onTime = 0, late = 0, early = 0, totalMinutes = 0, daysWithHours = 0;
    monthRecords.forEach(r => {
      const isLate = r.late_by && r.late_by !== "00:00:00";
      const isEarly = r.early_leave_by && r.early_leave_by !== "00:00:00";
      const isIncomplete = !r.total_worked || r.total_worked === "00:00:00";
      if (r.status === 'absent' || isIncomplete) return;
      if (isLate) late++;
      else if (isEarly) early++;
      else onTime++;
      const wMatch = r.total_worked?.match(/(\d{2}):(\d{2}):\d{2}/);
      if (wMatch) {
        totalMinutes += parseInt(wMatch[1]) * 60 + parseInt(wMatch[2]);
        daysWithHours++;
      }
    });
    const avgHours = daysWithHours > 0 ? (totalMinutes / daysWithHours / 60).toFixed(1) : '0.0';
    return { onTime, late, early, avgHours, totalRecords: onTime + late + early };
  }, [monthRecords]);

  const getRowStatus = (rec: any) => {
    if (rec.status === 'absent') return { label: 'Absent', variant: 'error' as const };
    if (!rec.total_worked || rec.total_worked === "00:00:00") return { label: 'Incomplete', variant: 'error' as const };
    if (rec.late_by && rec.late_by !== "00:00:00") return { label: 'Late', variant: 'warning' as const };
    if (rec.early_leave_by && rec.early_leave_by !== "00:00:00") return { label: 'Early Out', variant: 'warning' as const };
    return { label: 'On-Time', variant: 'success' as const };
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time & Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track working hours, review daily logs, and manage corrections.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" onClick={() => handleOpenModal('create')}>Request Correction</Button>
          <Button variant="secondary" className="flex items-center">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Top Row: Clock + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Clock Widget */}
        <div className="lg:col-span-1 bg-slate-900 rounded-xl p-5 flex flex-col items-center justify-center text-white">
          <Clock className="h-5 w-5 text-slate-400 mb-2" />
          <p className="text-2xl font-bold tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4 w-full">
            <button onClick={() => handleClockAction('in')} className="py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors">In</button>
            <button onClick={() => handleClockAction('out')} className="py-2 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10">Out</button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">On-Time Days</p>
            <p className="text-2xl font-bold text-slate-900">{analytics.onTime}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              {analytics.totalRecords > 0 ? Math.round((analytics.onTime / analytics.totalRecords) * 100) : 0}% punctuality
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Late Arrivals</p>
            <p className="text-2xl font-bold text-slate-900">{analytics.late}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">this month</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Early Departures</p>
            <p className="text-2xl font-bold text-slate-900">{analytics.early}</p>
            <p className="text-[10px] text-orange-600 font-semibold mt-1">this month</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Hours / Day</p>
            <p className="text-2xl font-bold text-slate-900">{analytics.avgHours}<span className="text-sm font-medium text-slate-400 ml-0.5">h</span></p>
            <p className="text-[10px] text-primary-600 font-semibold mt-1">daily average</p>
          </div>
        </div>
      </div>

      {/* Main Content: Daily Log + Requests Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily Attendance Log */}
        <div className="xl:col-span-2">
          <Card noPadding>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-800">Daily Log</h2>
                <span className="text-xs text-slate-400 font-medium">
                  {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3 border-b border-slate-100">Date</th>
                    <th className="px-5 py-3 border-b border-slate-100">Status</th>
                    <th className="px-5 py-3 border-b border-slate-100">Check In</th>
                    <th className="px-5 py-3 border-b border-slate-100">Check Out</th>
                    <th className="px-5 py-3 border-b border-slate-100">Worked</th>
                    <th className="px-5 py-3 border-b border-slate-100">Late By</th>
                    <th className="px-5 py-3 border-b border-slate-100">Early By</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">Loading attendance data...</td></tr>
                  ) : monthRecords.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">No records for this month.</td></tr>
                  ) : (
                    monthRecords.map((rec, i) => {
                      const status = getRowStatus(rec);
                      const dateObj = new Date(rec.date);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const isToday = rec.date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

                      return (
                        <tr key={i} className={`border-b border-slate-50 transition-colors ${isToday ? 'bg-primary-50/30' : 'hover:bg-slate-50/50'} ${isWeekend ? 'bg-slate-50/40' : ''}`}>
                          <td className="px-5 py-3">
                            <p className={`text-sm font-semibold ${isToday ? 'text-primary-700' : 'text-slate-800'}`}>
                              {dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {dateObj.toLocaleDateString([], { month: 'short', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            {isWeekend && rec.status !== 'present' ? (
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Weekend</span>
                            ) : (
                              <Badge variant={status.variant}>{status.label}</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 font-medium">{formatTime(rec.check_in)}</td>
                          <td className="px-5 py-3 text-sm text-slate-700 font-medium">{formatTime(rec.check_out)}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-slate-900">{formatDuration(rec.total_worked)}</td>
                          <td className="px-5 py-3">
                            {rec.late_by && rec.late_by !== '00:00:00' ? (
                              <span className="text-xs font-semibold text-amber-600">{formatDuration(rec.late_by)}</span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            {rec.early_leave_by && rec.early_leave_by !== '00:00:00' ? (
                              <span className="text-xs font-semibold text-orange-600">{formatDuration(rec.early_leave_by)}</span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Requests */}
        <div className="space-y-5">
          {/* Pending Corrections */}
          {pendingRequests.length > 0 && (
            <Card title="Pending Corrections">
              <div className="space-y-2">
                {pendingRequests.slice(0, 5).map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{new Date(req.date).toLocaleDateString([], { month:'short', day:'numeric' })}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">{req.reason || 'Correction request'}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal('view', req)} className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenModal('edit', req)} className="p-1 hover:text-amber-600 hover:bg-amber-50 rounded text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteRequest(req)} className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Requests */}
          <Card title="Correction History" noPadding>
            <div className="max-h-[420px] overflow-y-auto">
              {requests.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">No correction requests.</div>
              ) : (
                requests.map((req, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{new Date(req.date).toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' })}</p>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {req.morning_punch && <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">IN {req.morning_punch}</span>}
                        {req.leaving_punch && <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">OUT {req.leaving_punch}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal('view', req)} className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => handleOpenModal('edit', req)} className="p-1 hover:text-amber-600 hover:bg-amber-50 rounded text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteRequest(req)} className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'delete' ? "Confirm Delete" : modalMode === 'view' ? "View Request" : modalMode === 'edit' ? "Edit Correction" : "Request Attendance Correction"}
      >
        {modalMode === 'delete' ? (
           <div className="space-y-6">
              <p className="text-slate-600">Are you sure you want to delete this attendance correction request? This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-rose-500 hover:bg-rose-600 border-rose-500" onClick={executeDelete}>Delete Request</Button>
              </div>
           </div>
        ) : (
          <AttendanceRequestForm 
            onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
            onCancel={() => setIsModalOpen(false)} 
            editData={selectedRequest}
            isViewOnly={modalMode === 'view'}
          />
        )}
      </Modal>
    </MainLayout>
  );
};

export default Attendance;
