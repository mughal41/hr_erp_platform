import React, { useState, useEffect } from 'react';

import Input from '../common/Input';
import Button from '../common/Button';
import { leaveService } from '../../services/leave.service';

interface LeaveFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any;
  isViewOnly?: boolean;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ onSuccess, onCancel, editData, isViewOnly }) => {
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    leave_type: editData?.leave_type || '',
    start_date: editData?.start_date || new Date().toISOString().split('T')[0],
    end_date: editData?.end_date || new Date().toISOString().split('T')[0],
    start_day_type: editData?.start_day_type || 'full',
    end_day_type: editData?.end_day_type || 'full',
    selected_quarters: editData?.selected_quarters || ([] as string[]),
    reason: editData?.reason || '',
  });

  const isSingleDay = formData.start_date === formData.end_date;

  const quarters = [
    { id: 'Q1', label: 'Q1 (08:00 - 10:00)' },
    { id: 'Q2', label: 'Q2 (10:00 - 12:00)' },
    { id: 'Q3', label: 'Q3 (13:00 - 15:00)' },
    { id: 'Q4', label: 'Q4 (15:00 - 17:00)' },
  ];

  const getRequiredQuarters = (type: string) => {
    if (type === 'full') return 4;
    if (type === 'three_quarter') return 3;
    if (type === 'half') return 2;
    if (type === 'short') return 1;
    return 0;
  };

  const toggleQuarter = (id: string) => {
    if (isViewOnly) return;
    
    const required = getRequiredQuarters(formData.start_day_type);
    if (required === 4) return;

    setFormData(prev => {
      let next = [...prev.selected_quarters];
      if (next.includes(id)) {
        next = next.filter(q => q !== id);
      } else {
        if (next.length < required) {
          next.push(id);
        } else {
          next = [...next.slice(1), id];
        }
      }
      return { ...prev, selected_quarters: next.sort() };
    });
  };

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveService.getLeaveTypes();
        const types = response.data.results || response.data;
        setLeaveTypes(types);
        if (types.length > 0 && !editData?.leave_type) {
          setFormData(prev => ({ ...prev, leave_type: types[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch leave types', error);
      }
    };
    fetchLeaveTypes();
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'start_day_type' || name === 'start_date' || name === 'end_date') {
        if (next.start_day_type === 'full') {
          next.selected_quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        } else {
          next.selected_quarters = [];
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) {
      onCancel();
      return;
    }
    
    const required = getRequiredQuarters(formData.start_day_type);
    if (isSingleDay && formData.selected_quarters.length !== required) {
      alert(`Please select exactly ${required} quarter(s) for your leave duration.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_day_type: formData.start_day_type,
        end_day_type: formData.end_day_type,
        selected_quarters: formData.selected_quarters,
        reason: formData.reason,
      };

      if (editData) {
        await leaveService.updateLeaveRequest(editData.id, payload);
      } else {
        await leaveService.createLeaveRequest(payload);
      }
      onSuccess();
    } catch (error: any) {
      const errorMsg = typeof error.response?.data === 'object' 
        ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
        : error.response?.data?.detail;
      alert(errorMsg || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Leave Type</label>
            <select 
              name="leave_type" 
              value={formData.leave_type} 
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm ${isViewOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
            >
              <option value="">Select Type</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          {isSingleDay && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Duration</label>
              <select 
                name="start_day_type" 
                value={formData.start_day_type} 
                onChange={handleChange}
                required
                disabled={isViewOnly}
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm ${isViewOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
              >
                <option value="full">Full Day (1.0)</option>
                <option value="three_quarter">Three Quarter Day (0.75)</option>
                <option value="half">Half Day (0.50)</option>
                <option value="short">Short Leave (0.25)</option>
              </select>
            </div>
          )}

          {isSingleDay && formData.start_day_type !== 'full' && (
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Select {getRequiredQuarters(formData.start_day_type)} Quarter(s)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quarters.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => toggleQuarter(q.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                      formData.selected_quarters.includes(q.id)
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : isViewOnly ? 'bg-slate-50/50 border-slate-100 text-slate-300' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="From Date" 
            name="start_date" 
            type="date" 
            value={formData.start_date} 
            onChange={handleChange} 
            required
            disabled={isViewOnly} 
          />
          <Input 
            label="To Date" 
            name="end_date" 
            type="date" 
            value={formData.end_date} 
            onChange={handleChange} 
            required
            disabled={isViewOnly} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Reason / Description</label>
          <textarea 
            name="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            required
            disabled={isViewOnly}
            rows={4}
            className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm resize-none ${isViewOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
            placeholder="Please provide details about your request..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
        {isViewOnly ? (
           <Button type="button" onClick={onCancel}>Close</Button>
        ) : (
           <>
              <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : editData ? 'Update Request' : 'Send Request'}
              </Button>
           </>
        )}
      </div>
    </form>
  );
};

export default LeaveForm;
