import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const { login } = useApp();
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        toast('Account created successfully!', 'success');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }
        console.log('Sign in successful, auth state change will handle login...');
        toast('Welcome back!', 'success');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast(error.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">
      {/* Left Side - Branding/Marketing */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0d1117] text-white p-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/20 blur-[100px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden">
              <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M 12 12 L 38 12 L 12 64 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
                <path d="M 55 12 L 88 12 L 88 43 L 18 85 Z" fill="#f57c73" stroke="#f57c73" strokeWidth="8" strokeLinejoin="round" />
                <path d="M 42 88 L 88 60 L 88 88 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-serif text-xl font-bold tracking-tight">KDK Practice</div>
              <div className="text-[10px] text-white/50 tracking-widest uppercase">Suite</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-serif font-bold leading-[1.2] mb-6">
              The modern operating system for CA & Tax Professionals.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-12 max-w-md">
              Streamline compliance, automate workflows, and manage client communications from a single, unified workspace.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <ShieldCheck size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] mb-1">Bank-grade Security</h3>
                  <p className="text-[13px] text-white/50">Your client data is encrypted and secure.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Sparkles size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] mb-1">AI-Powered Automation</h3>
                  <p className="text-[13px] text-white/50">Let AI draft replies and extract task details.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Building2 size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] mb-1">Practice Suite</h3>
                  <p className="text-[13px] text-white/50">Kanban boards, document vault, and more.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-[13px] text-white/40 flex items-center gap-6">
          <span>© 2026 KDK Software</span>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/10 overflow-hidden">
              <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M 12 12 L 38 12 L 12 64 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
                <path d="M 55 12 L 88 12 L 88 43 L 18 85 Z" fill="#f57c73" stroke="#f57c73" strokeWidth="8" strokeLinejoin="round" />
                <path d="M 42 88 L 88 60 L 88 88 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-serif text-xl font-bold text-gray-900 tracking-tight">KDK Practice</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {mode === 'login' ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-[14px] text-gray-500 mb-8">
                  {mode === 'login' 
                    ? 'Enter your credentials to access your workspace.' 
                    : 'Join the modern platform for tax professionals.'}
                </p>

                <form onSubmit={handleAuth} className="space-y-5">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-2">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@kdk.com"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#0d1117] hover:bg-black text-white py-3 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[13px] text-blue-600 font-medium hover:underline"
                  >
                    {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
