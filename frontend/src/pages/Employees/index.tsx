import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Filter, EllipsisVertical, Mail, Phone, MapPin, Eye, RefreshCw, Copy, Check, Calendar } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import EmployeeForm from '../../components/features/EmployeeForm';
import { employeeService } from '../../services/employee.service';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Modals
  const [viewEmployee, setViewEmployee] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await employeeService.getDepartments();
      setDepartments(res.data.results || res.data);
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        department: selectedDept,
        page: currentPage,
        page_size: pageSize
      };
      const response = await employeeService.getEmployees(params);
      setEmployees(response.data.results || response.data);
      setTotalCount(response.data.count || (Array.isArray(response.data) ? response.data.length : 0));
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDept, currentPage]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchEmployees]);

  const handleExport = () => {
    const headers = ['Name', 'Role', 'Status', 'ID'];
    const csvData = employees.map(emp => [
      emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'N/A',
      emp.job_title_name || 'Staff',
      emp.is_active ? 'Active' : 'Inactive',
      emp.employee_number || 'N/A'
    ].join(','));
    
    const blob = new Blob([[headers.join(','), ...csvData].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'employees_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetPassword = async (empId: string) => {
    if (!window.confirm('Are you sure you want to reset this password?')) return;
    try {
      const res = await employeeService.resetEmployeePassword(empId);
      setGeneratedPassword(res.data.new_password);
    } catch (e) {
      alert('Failed to reset password');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-slate-500 mt-1">Manage and view all company personnel.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>Export</Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      <Card noPadding>
        {/* Table Header / Action Bar */}
        <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all outline-none"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/10"
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 font-medium">
            Showing {employees.length} of {totalCount} employees
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No employees found.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Avatar name={emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'User'} size="md" className="mr-3" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{emp.job_title_name || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.employee_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.department_name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.is_active ? 'success' : 'neutral'}>
                        {emp.employment_status || (emp.is_active ? 'Active' : 'Inactive')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setViewEmployee(emp)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Inspect Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(emp.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                          <EllipsisVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
        </div>
      </Card>

      {/* Detail Inspection Modal */}
      <Modal
        isOpen={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        title="Employee Details"
        size="lg"
      >
        {viewEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
               <Avatar name={viewEmployee.full_name} size="xl" />
               <div>
                  <h3 className="text-xl font-bold text-slate-900">{viewEmployee.full_name}</h3>
                  <p className="text-slate-500 font-medium">{viewEmployee.job_title_name} • {viewEmployee.department_name}</p>
                  <p className="text-xs text-slate-400 mt-1">ID: {viewEmployee.employee_number}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
               <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Work Information</h5>
                  <div className="space-y-3">
                     <p className="text-sm font-medium flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{viewEmployee.work_email || 'N/A'}</p>
                     <p className="text-sm font-medium flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Joined: {viewEmployee.date_of_joining || 'N/A'}</p>
                     <p className="text-sm font-medium">Type: {viewEmployee.employment_type || 'N/A'}</p>
                  </div>
               </div>
               <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Personal Details</h5>
                  <div className="space-y-3">
                     <p className="text-sm font-medium flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{viewEmployee.phone_number || 'N/A'}</p>
                     <p className="text-sm font-medium flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{viewEmployee.city || 'N/A'}, {viewEmployee.country || 'N/A'}</p>
                     <p className="text-sm font-medium">Gender: {viewEmployee.gender || 'N/A'}</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Password Success Modal */}
      <Modal
        isOpen={!!generatedPassword}
        onClose={() => setGeneratedPassword(null)}
        title="Temporary Credentials Created"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-6">A random password has been generated for the employee. Please copy and share it securely.</p>
          
          <div className="relative group mb-6">
            <div className="bg-slate-900 text-white font-mono py-4 px-6 rounded-xl text-lg tracking-widest">
              {generatedPassword}
            </div>
            <button 
              onClick={() => generatedPassword && copyToClipboard(generatedPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          
          <Button className="w-full" onClick={() => setGeneratedPassword(null)}>Done</Button>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add New Employee"
        size="lg"
      >
        <EmployeeForm 
          onSuccess={(data: any) => {
            setIsModalOpen(false);
            if (data?.generated_password) {
              setGeneratedPassword(data.generated_password);
            }
            fetchEmployees();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default Employees;
