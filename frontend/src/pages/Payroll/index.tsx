import React, { useEffect, useState } from 'react';
import { CreditCard, Download, ExternalLink, Filter, PieChart, TrendingUp } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { payrollService } from '../../services/payroll.service';

const Payroll: React.FC = () => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const response = await payrollService.getPayslips();
        setPayslips(response.data.results || response.data);
      } catch (error) {
        console.error('Failed to fetch payslips', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial & Payroll</h1>
          <p className="text-slate-500 mt-1">Manage your compensation, tax settings and payslips.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
          <Button className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" /> Salary Breakdown
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1 bg-primary-600 text-white border-none shadow-strong">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-white/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
             </div>
             <Badge variant="success" className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30">Active</Badge>
          </div>
          <p className="text-sm font-medium text-primary-100 uppercase tracking-wider">Gross Monthly Salary</p>
          <h2 className="text-4xl font-bold text-white mt-1">$4,500.00</h2>
          <div className="mt-8 flex items-center text-xs text-primary-100 font-medium">
             <TrendingUp className="h-3 w-3 mr-1" />
             <span>+5% from last year</span>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Card title="Net Take Home" subtitle="Average monthly">
              <div className="text-2xl font-bold text-slate-900">$3,842.50</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">After taxes and deductions</p>
           </Card>
           <Card title="Next Payday" subtitle="Estimated date">
              <div className="text-2xl font-bold text-slate-900">April 01, 2026</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">5 days remaining</p>
           </Card>
        </div>
      </div>

      {/* Payslips Table */}
      <Card title="Historical Payslips" noPadding>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                   <th className="px-6 py-4">Pay Period</th>
                   <th className="px-6 py-4">Gross Amount</th>
                   <th className="px-6 py-4">Deductions</th>
                   <th className="px-6 py-4">Net Paid</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading records...</td></tr>
                 ) : payslips.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No payslips found in your history.</td></tr>
                 ) : (
                    payslips.map((ps, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-sm font-semibold text-slate-900">{ps.period || 'Month, Year'}</p>
                           <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Processed: {new Date(ps.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">${ps.gross_amount}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">${ps.deductions}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold">${ps.net_amount}</td>
                        <td className="px-6 py-4"><Badge variant="success">Paid</Badge></td>
                        <td className="px-6 py-4 text-right">
                           <Button variant="ghost" size="sm" className="text-primary-600">
                              <Download className="h-4 w-4 mr-2" /> PDF
                           </Button>
                        </td>
                      </tr>
                    ))
                 )}
               </tbody>
            </table>
         </div>
      </Card>
    </MainLayout>
  );
};

export default Payroll;
