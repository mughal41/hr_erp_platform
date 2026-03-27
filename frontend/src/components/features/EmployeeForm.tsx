import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { employeeService } from '../../services/employee.service';

interface EmployeeFormProps {
  onSuccess: (data?: any) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    work_email: '',
    employee_number: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: '',
    job_title: '',
    date_of_joining: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, jobRes] = await Promise.all([
          employeeService.getDepartments(),
          employeeService.getJobTitles()
        ]);
        setDepartments(deptRes.data.results || deptRes.data);
        setJobTitles(jobRes.data.results || jobRes.data);
        
        // Set defaults if available
        if (deptRes.data.results?.[0] || deptRes.data?.[0]) {
          setFormData(prev => ({ 
            ...prev, 
            department: deptRes.data.results?.[0]?.id || deptRes.data?.[0]?.id 
          }));
        }
        if (jobRes.data.results?.[0] || jobRes.data?.[0]) {
          setFormData(prev => ({ 
            ...prev, 
            job_title: jobRes.data.results?.[0]?.id || jobRes.data?.[0]?.id 
          }));
        }
      } catch (error) {
        console.error('Failed to fetch form options', error);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await employeeService.createEmployee(formData);
      onSuccess(result.data);
    } catch (error: any) {
      console.error('Creation error:', error.response?.data);
      const errorMsg = typeof error.response?.data === 'object' 
        ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
        : error.response?.data?.detail;
      alert(errorMsg || 'Failed to create employee. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          label="First Name" 
          name="first_name" 
          value={formData.first_name} 
          onChange={handleChange} 
          required 
          placeholder="e.g. John" 
        />
        <Input 
          label="Last Name" 
          name="last_name" 
          value={formData.last_name} 
          onChange={handleChange} 
          required 
          placeholder="e.g. Doe" 
        />
        <div className="sm:col-span-2">
          <Input 
            label="Work Email Address" 
            name="work_email" 
            type="email" 
            value={formData.work_email} 
            onChange={handleChange} 
            required 
            placeholder="johndoe@company.com" 
          />
        </div>
        <Input 
          label="Employee ID" 
          name="employee_number" 
          value={formData.employee_number} 
          onChange={handleChange} 
          required 
        />
        <Input 
          label="Joining Date" 
          name="date_of_joining" 
          type="date" 
          value={formData.date_of_joining} 
          onChange={handleChange} 
          required 
        />
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Department</label>
          <select 
            name="department" 
            value={formData.department} 
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm bg-white"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Job Title</label>
          <select 
            name="job_title" 
            value={formData.job_title} 
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm bg-white"
          >
            <option value="">Select Designation</option>
            {jobTitles.map(jt => (
              <option key={jt.id} value={jt.id}>{jt.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Register Employee'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
