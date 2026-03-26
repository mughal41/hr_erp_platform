import React, { useState } from 'react';
import { Calendar, FileText, Send } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { leaveService } from '../../services/leave.service';

interface LeaveFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'ANNUAL', // Based on backend LeaveType model
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leaveService.createLeaveRequest({
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Leave Type</label>
          <select 
            name="leave_type" 
            value={formData.leave_type} 
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm bg-white"
          >
            <option value="ANNUAL">Annual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="MATERNITY">Maternity Leave</option>
            <option value="WFH">Work From Home</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="From Date" 
            name="start_date" 
            type="date" 
            value={formData.start_date} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="To Date" 
            name="end_date" 
            type="date" 
            value={formData.end_date} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Reason / Description</label>
          <textarea 
            name="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm resize-none"
            placeholder="Please provide details about your request..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Send Request'}
        </Button>
      </div>
    </form>
  );
};

export default LeaveForm;
