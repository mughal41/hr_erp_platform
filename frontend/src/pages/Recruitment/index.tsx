import React, { useEffect, useState } from 'react';
import { Briefcase, UserPlus, Search, ArrowRight, UserCheck, Timer } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { recruitmentService } from '../../services/recruitment.service';

const Recruitment: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await recruitmentService.getJobRequisitions();
        setJobs(response.data.results || response.data);
      } catch (error) {
        console.error('Failed to fetch jobs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recruitment & ATS</h1>
          <p className="text-slate-500 mt-1">Manage job openings, track candidates, and handle hiring.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">Candidate Pool</Button>
          <Button className="flex items-center">
            <UserPlus className="h-4 w-4 mr-2" /> New Requisition
          </Button>
        </div>
      </div>

      {/* Recruitment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Total Applicants', value: 124, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Interviews Today', value: 8, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Hires This Month', value: 12, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="card-minimal p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Job Openings */}
        <div className="xl:col-span-2 space-y-6">
           <Card title="Active Job Openings" extra={<div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" /><input type="text" className="pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-100" placeholder="Search jobs..."/></div>}>
              <div className="space-y-4">
                 {loading ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Loading job board...</div>
                 ) : jobs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                       <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
                       <p className="font-medium">No active requisitions</p>
                       <p className="text-xs mt-1">Start by creating a new job posting.</p>
                    </div>
                 ) : (
                    jobs.map((job, i) => (
                       <div key={i} className="p-5 border border-slate-100 rounded-xl hover:border-primary-100 hover:bg-slate-50/50 transition-all group cursor-pointer">
                          <div className="flex items-start justify-between">
                             <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{job.title || 'Senior Software Engineer'}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                   <p className="text-xs text-slate-500 flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {job.department_name || 'Engineering'}</p>
                                   <p className="text-xs text-slate-500 flex items-center font-bold tracking-tighter text-blue-600">{job.openings || 1} Openings</p>
                                </div>
                             </div>
                             <Badge variant={job.priority === 'urgent' ? 'error' : 'info'}>{job.status || 'Active'}</Badge>
                          </div>
                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                             <div className="flex -space-x-2">
                                {[1,2,3].map(a => <div key={a} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200"></div>)}
                                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">+12</div>
                             </div>
                             <button className="text-xs font-bold text-slate-400 group-hover:text-primary-600 flex items-center transition-colors">
                                Manage Applicants <ArrowRight className="h-3 w-3 ml-1" />
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </Card>
        </div>

        {/* Pipeline / Sidebar */}
        <div>
           <Card title="Hiring Pipeline" subtitle="Overall status">
              <div className="space-y-6 mt-2">
                 {[
                    { label: 'Applications', count: 450, color: 'bg-primary-500' },
                    { label: 'Interviews', count: 120, color: 'bg-blue-500' },
                    { label: 'Offers', count: 42, color: 'bg-emerald-500' },
                    { label: 'Hired', count: 38, color: 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
                 ].map((p, i) => (
                    <div key={i}>
                       <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{p.label}</span>
                          <span className="text-xs font-bold text-slate-900">{p.count}</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color}`} style={{ width: `${(p.count / 450) * 100}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           <Card className="mt-6 bg-slate-900 text-white border-none shadow-strong">
              <h4 className="font-bold text-lg">AI Resume Filter</h4>
              <p className="text-sm text-slate-400 mt-1 mb-4">Automatically score candidates based on job description.</p>
              <Button variant="primary" className="w-full bg-white text-slate-900 hover:bg-slate-100 border-none">Launch AI Filter</Button>
           </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Recruitment;
