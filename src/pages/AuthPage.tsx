import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Users } from 'lucide-react';

export function AuthPage() {
  const { setIsAuthenticated } = useApp();
  const toast = useToast();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone !== '9509264338') {
      toast('Invalid phone number. Use testing number: 9509264338', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast('OTP sent successfully', 'success');
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '1104') {
      toast('Invalid OTP. Use testing OTP: 1104', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsAuthenticated(true);
      toast('Welcome back!', 'success');
    }, 1000);
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
                  <h3 className="font-semibold text-[15px] mb-1">Practice Management</h3>
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
              {step === 'phone' ? (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                  <p className="text-[14px] text-gray-500 mb-8">Enter your phone number to sign in or create an account.</p>

                  <form onSubmit={handlePhoneSubmit} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9509264338"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || phone.length < 10}
                      className="w-full bg-[#0d1117] hover:bg-black text-white py-3 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Continue <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button 
                    onClick={() => setStep('phone')}
                    className="text-[13px] text-blue-600 font-medium hover:underline mb-6 flex items-center gap-1"
                  >
                    &larr; Back
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your number</h2>
                  <p className="text-[14px] text-gray-500 mb-8">
                    We've sent a 4-digit code to <span className="font-semibold text-gray-900">+91 {phone}</span>
                  </p>

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-2">Verification Code</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="1104"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[20px] tracking-[0.5em] text-center font-mono outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 4}
                      className="w-full bg-[#0d1117] hover:bg-black text-white py-3 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Verify & Sign In <CheckCircle2 size={18} /></>
                      )}
                    </button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <button className="text-[13px] text-gray-500 font-medium hover:text-gray-900 transition-colors">
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-8 text-center text-[13px] text-gray-500">
            Testing Credentials:<br/>
            Phone: <strong>9509264338</strong> | OTP: <strong>1104</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
