import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { attendanceService } from '../../services/attendance.service';

interface AttendanceRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any;
  isViewOnly?: boolean;
}

const AttendanceRequestForm: React.FC<AttendanceRequestFormProps> = ({ onSuccess, onCancel, editData, isViewOnly }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingDate, setFetchingDate] = useState(false);
  
  const [date, setDate] = useState(editData ? editData.date : new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState(editData ? editData.reason : '');

  const [punchValues, setPunchValues] = useState({
    morning_punch: editData?.morning_punch || '',
    break_start_punch: editData?.break_start_punch || '',
    break_end_punch: editData?.break_end_punch || '',
    leaving_punch: editData?.leaving_punch || '',
  });

  useEffect(() => {
    // If we're editing or viewing, and it's the first render (date matches editData.date), 
    // we already initialized the fields with editData. We probably don't want to overwrite them 
    // with the actual fetched attendance records because we want to see/edit what the user submitted.
    if (editData && date === editData.date) {
        return; 
    }

    const fetchExistingData = async () => {
      setFetchingDate(true);
      try {
        const res = await attendanceService.getAttendanceByDate(date);
        const data = res.data;
        setPunchValues({
          morning_punch: data.morning_punch || '',
          break_start_punch: data.break_start_punch || '',
          break_end_punch: data.break_end_punch || '',
          leaving_punch: data.leaving_punch || '',
        });
      } catch (error) {
        console.error("Failed to fetch existing data for date", error);
        setPunchValues({
          morning_punch: '', break_start_punch: '', break_end_punch: '', leaving_punch: ''
        });
      } finally {
        setFetchingDate(false);
      }
    };
    
    if (date && !isViewOnly) {
      fetchExistingData();
    }
  }, [date, editData, isViewOnly]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPunchValues({ ...punchValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) {
      onCancel();
      return;
    }
    
    const payload: any = {
      date,
      reason,
      morning_punch: punchValues.morning_punch || null,
      break_start_punch: punchValues.break_start_punch || null,
      break_end_punch: punchValues.break_end_punch || null,
      leaving_punch: punchValues.leaving_punch || null,
    };
    
    if (!payload.morning_punch && !payload.break_start_punch && !payload.break_end_punch && !payload.leaving_punch) {
      alert("Please provide at least one punch time.");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
         await attendanceService.updateAttendanceRequest(editData.id, payload);
      } else {
         await attendanceService.createAttendanceRequest(payload);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Request error:', error.response?.data);
      const errorMsg = typeof error.response?.data === 'object' 
        ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
        : error.response?.data?.detail;
      alert(errorMsg || 'Failed to submit attendance request.');
    } finally {
      setLoading(false);
    }
  };

  const renderPunchField = (key: keyof typeof punchValues, label: string) => {
    return (
      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        
        <Input 
          name={key}
          type="time"
          value={punchValues[key]}
          onChange={handleValueChange}
          disabled={isViewOnly}
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div className="relative">
           <Input 
             label="Date to Correct"
             name="date"
             type="date"
             value={date}
             onChange={(e) => setDate(e.target.value)}
             required
             disabled={isViewOnly || !!editData} // Usually can't change date of an existing request, just make a new one
           />
           {fetchingDate && <span className="absolute right-4 top-1/2 -translate-y-1/2 mt-3 text-xs text-primary-500 font-bold">Loading...</span>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderPunchField('morning_punch', 'Morning Punch (In)')}
          {renderPunchField('break_start_punch', 'Break Start')}
          {renderPunchField('break_end_punch', 'Break End')}
          {renderPunchField('leaving_punch', 'Leaving Punch (Out)')}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Reason for Request</label>
          <textarea 
            name="reason" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            required
            disabled={isViewOnly}
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm resize-none ${isViewOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
            placeholder="e.g. Forgot to clock in, Official meeting outside, etc."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
        {isViewOnly ? (
          <Button type="button" onClick={onCancel}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || fetchingDate}>
              {loading ? 'Submitting...' : editData ? 'Update Request' : 'Send Request'}
            </Button>
          </>
        )}
      </div>
    </form>
  );
};

export default AttendanceRequestForm;
