import React, { useState } from 'react';
import { Building2, User, Shield, Bell, Globe, Camera } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'security'>('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 mt-1">Configure your personal preferences and organization profile.</p>
        </div>
        <Button>Save Changes</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:w-64 flex-shrink-0">
           <nav className="space-y-1">
              {tabs.map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium text-sm
                       ${activeTab === tab.id 
                          ? 'bg-primary-600 text-white shadow-strong' 
                          : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100'}
                    `}
                 >
                    <tab.icon className={`h-4 w-4 mr-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                    {tab.label}
                 </button>
              ))}
           </nav>
        </aside>

        {/* Form Area */}
        <div className="flex-1 max-w-3xl">
           {activeTab === 'profile' && (
              <div className="space-y-6">
                 <Card title="Personal Information">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                       <div className="relative group cursor-pointer">
                          <Avatar size="xl" name="Admin User" className="group-hover:opacity-80 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Camera className="h-6 w-6 text-white" />
                          </div>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-900">Profile Picture</h4>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG or GIF. Max size 2MB.</p>
                          <div className="flex gap-2 mt-3">
                             <Button variant="secondary" size="sm">Update</Button>
                             <Button variant="ghost" size="sm" className="text-rose-500">Remove</Button>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Input label="First Name" defaultValue="Admin" />
                       <Input label="Last Name" defaultValue="User" />
                       <Input label="Email Address" defaultValue="admin@hrms.com" disabled />
                       <Input label="Phone Number" defaultValue="+1 (555) 000-0000" />
                       <div className="md:col-span-2">
                          <Input label="Role" defaultValue="Head of HR / Administrator" disabled />
                       </div>
                    </div>
                 </Card>

                 <Card title="Preferences">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-lg"><Bell className="h-4 w-4 text-slate-500" /></div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">Email Notifications</p>
                                <p className="text-[10px] text-slate-500">Receive alerts about leave approvals and company news.</p>
                             </div>
                          </div>
                          <div className="w-10 h-5 bg-primary-600 rounded-full relative"><div className="absolute right-0.5 top-0.5 h-4 w-4 bg-white rounded-full"></div></div>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-lg"><Globe className="h-4 w-4 text-slate-500" /></div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">Dark Mode</p>
                                <p className="text-[10px] text-slate-500">Switch between light and dark visual themes.</p>
                             </div>
                          </div>
                          <div className="w-10 h-5 bg-slate-200 rounded-full relative"><div className="absolute left-0.5 top-0.5 h-4 w-4 bg-white rounded-full"></div></div>
                       </div>
                    </div>
                 </Card>
              </div>
           )}

           {activeTab === 'company' && (
              <div className="space-y-6">
                 <Card title="Brand Identity">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Input label="Company Name" defaultValue="HRMS Corp." />
                       <Input label="Industry" defaultValue="Technology / Software" />
                       <div className="md:col-span-2">
                          <Input label="Office Website" defaultValue="https://hrmscorp.example.com" />
                       </div>
                    </div>
                 </Card>
                 <Card title="Location Settings">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Input label="Timezone" defaultValue="(GMT+05:00) Pakistan Standard Time" />
                       <Input label="Currency" defaultValue="USD ($) - US Dollar" />
                    </div>
                 </Card>
              </div>
           )}

           {activeTab === 'security' && (
              <div className="space-y-6">
                 <Card title="Change Password">
                    <div className="space-y-6">
                       <Input label="Current Password" type="password" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="New Password" type="password" />
                          <Input label="Confirm New Password" type="password" />
                       </div>
                    </div>
                 </Card>
                 <Card title="Active Sessions">
                    <div className="space-y-4">
                       <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                          <div>
                             <p className="text-sm font-bold text-slate-900">Chrome on MacOS</p>
                             <p className="text-[10px] text-slate-500">Last active: Just now (Current session)</p>
                          </div>
                          <Badge variant="success">Current</Badge>
                       </div>
                       <Button variant="ghost" size="sm" className="text-rose-500">Log out from all other devices</Button>
                    </div>
                 </Card>
              </div>
           )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
