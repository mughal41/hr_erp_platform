import React, { useEffect, useState, useMemo } from 'react';
import { Users, Clock, FileText, TrendingUp, ChevronRight, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmployeeForm from '../../components/features/EmployeeForm';
import LeaveForm from '../../components/features/LeaveForm';
import { attendanceService } from '../../services/attendance.service';
import { employeeService } from '../../services/employee.service';
import { leaveService } from '../../services/leave.service';

const Dashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'employee' | 'leave' | null>(null);

  // Data
  const [analytics, setAnalytics] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAdmin = user?.is_hr_admin || user?.is_superuser;
  const isManager = user?.is_manager;
  const firstName = user?.first_name || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        attendanceService.getAnalytics().catch(() => ({ data: {} })),
        attendanceService.getAttendance().catch(() => ({ data: [] })),
        leaveService.getLeaveRequests().catch(() => ({ data: [] })),
        attendanceService.getAttendanceRequests().catch(() => ({ data: [] })),
        leaveService.getLeaveBalances().catch(() => ({ data: [] })),
      ];
      if (isAdmin) {
        promises.push(employeeService.getEmployees().catch(() => ({ data: [] })));
      }

      const [analyticsRes, recordsRes, leaveRes, attReqRes, balRes, empRes] = await Promise.all(promises);
      setAnalytics(analyticsRes.data || {});
      setRecords(recordsRes.data?.results || recordsRes.data || []);
      setLeaveRequests(leaveRes.data?.results || leaveRes.data || []);
      setAttendanceRequests(attReqRes.data?.results || attReqRes.data || []);
      setLeaveBalances(balRes.data?.results || balRes.data || []);
      if (empRes) setEmployees(empRes.data?.results || empRes.data || []);
    } catch (error) {
      console.error('Dashboard fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleClockAction = async (action: 'in' | 'out') => {
    try {
      if (action === 'in') {
        await attendanceService.clockIn({ check_in_method: 'web', check_in_location: 'Office (Verified)' });
      } else {
        await attendanceService.clockOut({ check_out_method: 'web' });
      }
      fetchAll();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed.');
    }
  };

  // Computed metrics
  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending');
  const pendingAttendance = attendanceRequests.filter(r => r.status === 'pending');
  const totalPending = pendingLeaves.length + pendingAttendance.length;

  const headcount = isAdmin ? employees.length : (analytics?.today?.present + analytics?.today?.absent || 0);
  const presentToday = analytics?.today?.present || 0;
  const absentToday = analytics?.today?.absent || 0;
  const avgHours = analytics?.average_working_hours || 0;
  const attendanceRate = (presentToday + absentToday) > 0 ? Math.round((presentToday / (presentToday + absentToday)) * 100) : 0;

  // Weekly attendance heatmap data (last 4 weeks from records)
  const weeklyHeatmap = useMemo(() => {
    const today = new Date();
    const weeks: { label: string; days: { date: string; rate: number; dayLabel: string }[] }[] = [];
    
    for (let w = 3; w >= 0; w--) {
      const weekDays: { date: string; rate: number; dayLabel: string }[] = [];
      for (let d = 0; d < 5; d++) {
        const offset = w * 7 + (4 - d);
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        // Adjust to get Mon-Fri
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const rec = records.find(r => r.date === dateStr);
        
        let rate = -1; // no data
        if (rec) {
          if (rec.status === 'present' || rec.status === 'half_day') rate = 1;
          else if (rec.status === 'absent') rate = 0;
          else rate = 0.5;
        }
        
        weekDays.push({
          date: dateStr,
          rate,
          dayLabel: date.toLocaleDateString([], { weekday: 'short' })
        });
      }
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - w * 7 - 4);
      weeks.push({
        label: `W${4 - w}`,
        days: weekDays.slice(0, 5)
      });
    }
    return weeks;
  }, [records]);

  const getHeatmapColor = (rate: number) => {
    if (rate < 0) return 'bg-slate-100 border-slate-100'; // no data
    if (rate >= 0.9) return 'bg-emerald-100 border-emerald-200';
    if (rate >= 0.5) return 'bg-amber-100 border-amber-200';
    return 'bg-red-100 border-red-200';
  };

  // Greeting
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <MainLayout>
      {/* Row 1: Greeting + Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {totalPending > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">
                 - {totalPending} pending {totalPending === 1 ? 'action' : 'actions'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="h-4 w-px bg-white/20 mx-1"></div>
            <button onClick={() => handleClockAction('in')} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">In</button>
            <button onClick={() => handleClockAction('out')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Out</button>
          </div>
          {isAdmin && <Button onClick={() => setActiveModal('employee')}>Add Employee</Button>}
        </div>
      </div>

      {/* Row 2: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {isAdmin ? 'Total Headcount' : 'Workforce'}
              </p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : headcount}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">active employees</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50"><Users className="h-4 w-4 text-blue-600" /></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Present Today</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : presentToday}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">{attendanceRate}% attendance</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">On Leave</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : absentToday}</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">{pendingLeaves.length} pending approval</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50"><FileText className="h-4 w-4 text-amber-600" /></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Hours</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : `${avgHours}`}<span className="text-sm font-medium text-slate-400 ml-0.5">h</span></p>
              <p className="text-[10px] text-primary-600 font-semibold mt-1">daily average</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary-50"><TrendingUp className="h-4 w-4 text-primary-600" /></div>
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap + Pending Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Weekly Attendance Heatmap */}
        <div className="xl:col-span-2">
          <Card title="Attendance Overview" subtitle="Last 4 weeks" extra={
            <button onClick={() => navigate('/attendance')} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
              View Details <ChevronRight className="h-3 w-3" />
            </button>
          }>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading...</div>
            ) : (
              <div className="space-y-2">
                {/* Day headers */}
                <div className="grid grid-cols-6 gap-2">
                  <div></div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>
                {/* Week rows */}
                {weeklyHeatmap.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-6 gap-2">
                    <div className="flex items-center text-[10px] font-bold text-slate-400">{week.label}</div>
                    {week.days.map((day, di) => (
                      <div
                        key={di}
                        className={`h-10 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors ${getHeatmapColor(day.rate)}`}
                        title={`${day.date}: ${day.rate >= 0 ? (day.rate >= 0.9 ? 'Present' : day.rate >= 0.5 ? 'Partial' : 'Absent') : 'No data'}`}
                      >
                        {day.rate >= 0 ? (
                          <span className={day.rate >= 0.9 ? 'text-emerald-700' : day.rate >= 0.5 ? 'text-amber-700' : 'text-red-700'}>
                            {day.rate >= 0.9 ? '✓' : day.rate >= 0.5 ? '½' : '✗'}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    ))}
                    {/* Pad if fewer than 5 days */}
                    {Array.from({ length: Math.max(0, 5 - week.days.length) }).map((_, pi) => (
                      <div key={`pad-${pi}`} className="h-10 rounded-lg bg-slate-50 border border-slate-100"></div>
                    ))}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
                    <span className="text-[10px] font-semibold text-slate-500">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
                    <span className="text-[10px] font-semibold text-slate-500">Partial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                    <span className="text-[10px] font-semibold text-slate-500">Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-100 border border-slate-100"></div>
                    <span className="text-[10px] font-semibold text-slate-500">No data</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Pending Actions Feed */}
        <div>
          <Card title="Pending Actions" noPadding extra={
            totalPending > 0 ? <Badge variant="warning">{totalPending}</Badge> : null
          }>
            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="p-5 text-center text-sm text-slate-400">Loading...</div>
              ) : totalPending === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">All clear!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No pending actions right now.</p>
                </div>
              ) : (
                <>
                  {pendingLeaves.slice(0, 4).map((req, i) => (
                    <div key={`leave-${i}`} className="px-5 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="warning">Leave</Badge>
                            <span className="text-xs font-semibold text-slate-800 truncate">{req.employee_name || 'Employee'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {req.leave_type_name || 'Leave'} - {new Date(req.start_date).toLocaleDateString([], {month:'short', day:'numeric'})} to {new Date(req.end_date).toLocaleDateString([], {month:'short', day:'numeric'})}
                            <span className="ml-1 font-bold text-slate-600">{parseFloat(req.total_days).toFixed(1)}d</span>
                          </p>
                        </div>
                        {(isAdmin || isManager) && (
                          <div className="flex gap-1 shrink-0 ml-2">
                            <button 
                              onClick={async () => { try { await leaveService.approveLeaveRequest(req.id); fetchAll(); } catch(e) { console.error(e); }}}
                              className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="Approve"
                            ><CheckCircle className="w-4 h-4" /></button>
                            <button 
                              onClick={async () => { try { await leaveService.rejectLeaveRequest(req.id); fetchAll(); } catch(e) { console.error(e); }}}
                              className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors" title="Reject"
                            ><XCircle className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {pendingAttendance.slice(0, 4).map((req, i) => (
                    <div key={`att-${i}`} className="px-5 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="info">Correction</Badge>
                            <span className="text-xs font-semibold text-slate-800 truncate">{req.employee_name || 'Employee'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {new Date(req.date).toLocaleDateString([], {month:'short', day:'numeric'})}
                            {req.reason && <span className="ml-1">- {req.reason.substring(0, 40)}</span>}
                          </p>
                        </div>
                        {(isAdmin || isManager) && (
                          <div className="flex gap-1 shrink-0 ml-2">
                            <button onClick={() => navigate('/attendance')} className="p-1 text-primary-500 hover:bg-primary-50 rounded transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {totalPending > 8 && (
                    <div className="px-5 py-3 text-center">
                      <span className="text-xs text-slate-400 font-bold">+{totalPending - 8} more</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 4: Leave Balances + Quick Navigation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Leave Balances */}
        <div className="xl:col-span-2">
          <Card title="Leave Balances" extra={
            <button onClick={() => navigate('/leave')} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
              Manage Leaves <ChevronRight className="h-3 w-3" />
            </button>
          }>
            {loading ? (
              <div className="h-20 flex items-center justify-center text-sm text-slate-400">Loading...</div>
            ) : leaveBalances.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">No leave balances found.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {leaveBalances.map((bal, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{bal.leave_type_name || 'Leave'}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-bold text-slate-900">{parseFloat(bal.available).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-bold mb-0.5">/ {bal.opening_balance}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (parseFloat(bal.used) / Math.max(1, parseFloat(bal.opening_balance))) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Navigation */}
        <div>
          <Card title="Quick Actions">
            <div className="space-y-2">
              <button 
                onClick={() => setActiveModal('leave')}
                className="w-full p-3 text-left border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all group flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">Request Leave</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Submit a new time-off request</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
              </button>
              <button 
                onClick={() => navigate('/attendance')}
                className="w-full p-3 text-left border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all group flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">Attendance Log</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">View daily records and corrections</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
              </button>
              <button 
                onClick={() => navigate('/payroll')}
                className="w-full p-3 text-left border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all group flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">View Payslip</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Access salary and compensation</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => navigate('/employees')}
                  className="w-full p-3 text-left border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all group flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">Manage Employees</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">View directory and profiles</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'employee'} 
        onClose={() => setActiveModal(null)}
        title="Register New Employee"
        size="lg"
      >
        <EmployeeForm 
          onSuccess={() => { setActiveModal(null); fetchAll(); }} 
          onCancel={() => setActiveModal(null)} 
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'leave'} 
        onClose={() => setActiveModal(null)}
        title="Submit Leave Request"
      >
        <LeaveForm 
          onSuccess={() => { setActiveModal(null); fetchAll(); }} 
          onCancel={() => setActiveModal(null)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default Dashboard;
