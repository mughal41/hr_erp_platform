import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { leaveService } from '../../services/leave.service';

const LeaveQuotaSettings: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveTypes();
      setLeaveTypes(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch leave types', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const handleQuotaChange = (id: string, value: string) => {
    setLeaveTypes(prev => prev.map(lt => 
      lt.id === id ? { ...lt, annual_quota: value } : lt
    ));
  };

  const handleUpdate = async (id: string) => {
    const leaveType = leaveTypes.find(lt => lt.id === id);
    if (!leaveType) return;

    setSaving(id);
    try {
      // Use the new bulk update action
      await leaveService.bulkUpdateQuota(id, parseFloat(leaveType.annual_quota));
      alert(`Successfully updated quota for ${leaveType.name}.`);
      fetchLeaveTypes();
    } catch (error: any) {
      console.error('Update failed', error);
      alert(error.response?.data?.error || 'Failed to update quota.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Quota Management</h1>
        <p className="text-slate-500 mt-1">Set universal annual quotas for each leave type. Updates will apply to all employees for the current year.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card title="Universal Leave Quotas" subtitle="Annual Allocation (Days)" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 w-48">Annual Quota (Days)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading settings...</td></tr>
                ) : leaveTypes.length > 0 ? (
                  leaveTypes.map((lt) => (
                    <tr key={lt.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: lt.color_code || '#cbd5e1' }}></div>
                          <span className="font-semibold text-slate-900">{lt.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{lt.code}</td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          step="0.5"
                          value={lt.annual_quota}
                          onChange={(e) => handleQuotaChange(lt.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary-100 transition-all font-bold text-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdate(lt.id)}
                          disabled={saving === lt.id}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving === lt.id ? 'Saving...' : 'Update Quota'}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No leave types defined in system.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Help & Information" className="bg-slate-50 border-none">
          <div className="space-y-4 text-sm text-slate-600">
            <p className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              Updating a quota here will change the default for all new employees and also update the opening balance for all existing employees for the <strong>current calendar year</strong>.
            </p>
            <p className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              Deductions for existing leaves already taken will remain as they are. Only the total entitlement is updated.
            </p>
            <p className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              For maternity/paternity leaves, quotas are typically higher and may have specific eligibility rules.
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default LeaveQuotaSettings;
