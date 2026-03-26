import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Mail, Phone, MapPin } from 'lucide-react';
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

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployees();
      setEmployees(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  const filteredEmployees = employees.filter(emp => {
    const fullName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const empId = (emp.employee_number || '').toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || empId.includes(searchTerm.toLowerCase());
  });

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
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Showing {filteredEmployees.length} employees
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
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
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
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg shadow-none hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add New Employee"
        size="lg"
      >
        <EmployeeForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmployees();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default Employees;
