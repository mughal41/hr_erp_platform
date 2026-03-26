import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { employeeService } from '../../services/employee.service';

interface EmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_data: {
      email: '',
      first_name: '',
      last_name: '',
      password: 'password123', // Default for new employees
    },
    employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    designation: '',
    department: '',
    date_of_joining: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('user.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        user_data: { ...formData.user_data, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await employeeService.createEmployee({
        user: formData.user_data,
        employee_id: formData.employee_id,
        designation: formData.designation,
        date_of_joining: formData.date_of_joining,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create employee. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          label="First Name" 
          name="user.first_name" 
          value={formData.user_data.first_name} 
          onChange={handleChange} 
          required 
          placeholder="e.g. John" 
        />
        <Input 
          label="Last Name" 
          name="user.last_name" 
          value={formData.user_data.last_name} 
          onChange={handleChange} 
          required 
          placeholder="e.g. Doe" 
        />
        <div className="sm:col-span-2">
          <Input 
            label="Work Email Address" 
            name="user.email" 
            type="email" 
            value={formData.user_data.email} 
            onChange={handleChange} 
            required 
            placeholder="johndoe@company.com" 
          />
        </div>
        <Input 
          label="Employee ID" 
          name="employee_id" 
          value={formData.employee_id} 
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
        <div className="sm:col-span-2">
          <Input 
            label="Designation / Job Title" 
            name="designation" 
            value={formData.designation} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Senior Software Engineer" 
          />
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
