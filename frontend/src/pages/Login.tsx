import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import api from '../services/api';
import { Building2, Lock, Mail, ChevronRight, LayoutDashboard, Target, Users, Zap } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/token/', { email, password });
            const { access, refresh } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            dispatch(loginSuccess({ user: { email }, token: access }));

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            {/* Left Content - Visual Section */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-16">
                {/* Abstract Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[100px]" />
                </div>
                
                <div className="relative z-10 max-w-xl text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-8">
                        <Zap className="h-3 w-3 text-primary-400 fill-primary-400" />
                        Next-Gen Enterprise Portal
                    </div>
                    <h1 className="text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                        Manage your <span className="text-primary-400">Workforce</span> with precision.
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed mb-12">
                        Experience the most powerful single-tenant HR & ERP platform designed for modern enterprises. Streamlined, secure, and lightning-fast.
                    </p>
                    
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-2 gap-6 text-left">
                        {[
                            { icon: Target, title: 'Strategic Planning', desc: 'KPI & OKR tracking' },
                            { icon: Users, title: 'Talent Acquisition', desc: 'Integrated ATS' },
                            { icon: LayoutDashboard, title: 'Real-time Analytics', desc: 'Workforce insights' },
                            { icon: Lock, title: 'Bank-Grade Security', desc: 'Encrypted & Isolated' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary-400 h-fit">
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-0.5">{item.title}</h4>
                                    <p className="text-[10px] text-slate-500 leading-tight uppercase font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Floating "System Status" Indicator */}
                <div className="absolute bottom-12 left-12 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                    <span className="text-sm font-medium text-slate-300">v1.2.0 Systems Online</span>
                </div>
            </div>

            {/* Right Content - Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50/30">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-strong">
                            <Building2 className="text-white h-7 w-7" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 mt-2 font-medium">Please enter your credentials to access the portal.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                                <Lock className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-rose-800">{error}</p>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <Input 
                                label="Work Email Address"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="bg-white"
                            />
                            
                            <div className="space-y-1.5 text-right">
                                <Input 
                                    label="Password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-white"
                                />
                                <button type="button" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider">
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button 
                                type="submit" 
                                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-base shadow-strong"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Authenticating...
                                    </div>
                                ) : (
                                    <>
                                        Secure Sign In
                                        <ChevronRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <p className="text-center text-sm text-slate-400 font-medium">
                            Don't have an account? <button className="text-primary-600 font-bold hover:underline">Contact System Admin</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
