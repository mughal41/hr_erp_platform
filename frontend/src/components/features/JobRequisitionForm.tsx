import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { recruitmentService } from '../../services/recruitment.service';

interface JobRequisitionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const JobRequisitionForm: React.FC<JobRequisitionFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    job_type: 'full-time',
    location: 'Remote',
    experience_level: 'Mid-Level',
    description: '',
    salary_range: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recruitmentService.createRequisition(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create requisition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input 
            label="Job Position Title" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Senior Product Designer" 
          />
        </div>
        <Input 
          label="Department" 
          name="department" 
          value={formData.department} 
          onChange={handleChange} 
          required 
          placeholder="e.g. Design" 
        />
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Job Type</label>
          <select 
            name="job_type" 
            value={formData.job_type} 
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm bg-white"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <Input 
          label="Location" 
          name="location" 
          value={formData.location} 
          onChange={handleChange} 
          required 
        />
        <Input 
          label="Salary Range" 
          name="salary_range" 
          value={formData.salary_range} 
          onChange={handleChange} 
          placeholder="e.g. $80k - $120k" 
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Job Description</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          required
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm resize-none"
          placeholder="Describe the role and requirements..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Open Requisition'}
        </Button>
      </div>
    </form>
  );
};

export default JobRequisitionForm;
