import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Building2, BarChart3, Menu, X, Users, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DashboardPreview = () => {
  const [imageError, setImageError] = useState(false);

  if (!imageError) {
    return (
      <img 
        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
        alt="Dashboard Preview" 
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Mock Sidebar */}
      <div className="w-20 md:w-64 border-r border-white/10 bg-white/5 hidden sm:flex flex-col p-6">
        <div className="h-8 w-32 bg-white/20 rounded-lg mb-10" />
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 w-5 bg-white/10 rounded" />
              <div className="h-2 w-24 bg-white/5 rounded-full hidden md:block" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Mock Dashboard Content */}
      <div className="flex-1 p-8 overflow-hidden">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="h-1.5 w-24 bg-[#3a749b] rounded-full mb-3" />
            <div className="h-7 w-64 bg-white/20 rounded-lg mb-2" />
            <div className="h-2 w-48 bg-white/5 rounded-full" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-32 bg-white/5 border border-white/10 rounded-xl" />
            <div className="h-9 w-36 bg-[#3a749b] rounded-xl shadow-lg shadow-[#3a749b]/20" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-10">
          {[
            { label: 'Active Tasks', value: '24', color: 'bg-[#3a749b]', trend: '+12%' },
            { label: 'Clients', value: '128', color: 'bg-emerald-500', trend: '+5%' },
            { label: 'Deadlines', value: '12', color: 'bg-[#f57c73]', trend: '-2' },
            { label: 'Revenue', value: '₹4.2L', color: 'bg-indigo-500', trend: '+18%' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-3 md:p-5 flex flex-col justify-between hover:bg-white/[0.07] transition-colors group cursor-default">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${stat.color}/10 flex items-center justify-center border border-${stat.color}/20`}>
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${stat.color}`} />
                </div>
                <div className="text-[10px] font-bold text-emerald-400">{stat.trend}</div>
              </div>
              <div>
                <div className="h-1.5 md:h-2 w-12 md:w-16 bg-white/10 rounded-full mb-2" />
                <div className="h-4 md:h-6 w-16 md:w-24 bg-white/40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl bg-white/5 border border-white/10 p-4 md:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-4 w-40 bg-white/20 rounded-lg mb-1.5" />
                <div className="h-2 w-24 bg-white/5 rounded-full" />
              </div>
              <div className="hidden sm:flex gap-2">
                <div className="h-7 w-20 bg-white/5 rounded-lg" />
                <div className="h-7 w-7 bg-white/5 rounded-lg" />
              </div>
            </div>
            <div className="space-y-3.5 flex-1">
              {[
                { title: 'GST Filing - Reliance Ind.', status: 'High', date: '2 days left', color: 'bg-[#f57c73]' },
                { title: 'Audit Report - Tata Steel', status: 'Medium', date: '5 days left', color: 'bg-[#3a749b]' },
                { title: 'TDS Reconciliation', status: 'Low', date: 'Next week', color: 'bg-emerald-500' },
                { title: 'Income Tax Return - Sharma', status: 'High', date: 'Tomorrow', color: 'bg-[#f57c73]' },
              ].map((task, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/5 flex items-center px-4 md:px-5 justify-between hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-2 h-2 rounded-full ${task.color} shadow-lg shadow-${task.color}/50`} />
                    <div>
                      <div className="h-2 w-32 md:w-48 bg-white/20 rounded-full mb-1.5" />
                      <div className="h-1.5 w-20 md:w-32 bg-white/5 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden sm:block h-2 w-16 bg-white/10 rounded-full" />
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 border border-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-4 md:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="h-4 w-32 bg-white/20 rounded-lg" />
              <div className="h-2 w-16 bg-white/5 rounded-full" />
            </div>
            <div className="flex-1 flex items-end gap-2 md:gap-3 h-40 md:h-48 px-2 mb-6">
              {[35, 65, 45, 85, 55, 75, 40, 60, 25, 50, 70, 90].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-[#3a749b]/20 to-[#3a749b]/60 rounded-t-lg transition-all hover:to-[#3a749b] cursor-pointer" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between pt-4 border-t border-white/5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-1.5 w-8 md:w-10 bg-white/5 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0d1117]/80 backdrop-blur-md z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden border border-white/10">
                <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 12 12 L 38 12 L 12 64 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
                  <path d="M 55 12 L 88 12 L 88 43 L 18 85 Z" fill="#f57c73" stroke="#f57c73" strokeWidth="8" strokeLinejoin="round" />
                  <path d="M 42 88 L 88 60 L 88 88 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-lg font-bold tracking-tight text-white leading-none">KDK Practice</div>
                <div className="text-[9px] text-white/50 tracking-widest uppercase mt-0.5">Suite</div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors">Benefits</a>
              <button 
                onClick={() => navigate('/login')}
                className="text-[13px] font-medium text-white/70 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-[#3a749b] hover:bg-[#2d5a7a] text-white px-5 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white/70 hover:text-white">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d1117] border-b border-white/10 px-4 pt-2 pb-4 space-y-1 shadow-lg">
            <a href="#features" className="block px-3 py-2 rounded-md text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/5">Features</a>
            <a href="#benefits" className="block px-3 py-2 rounded-md text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/5">Benefits</a>
            <button onClick={() => navigate('/login')} className="block w-full text-left px-3 py-2 rounded-md text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/5">Sign In</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 relative bg-[#0d1117] text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3a749b]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#f57c73]/20 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm mb-6 sm:mb-8">
                <Sparkles size={14} className="text-[#f57c73]" />
                <span className="text-[10px] sm:text-[12px] font-medium text-white/70 uppercase tracking-wider">The modern operating system for CA & Tax Professionals</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white mb-4 sm:mb-6 leading-[1.1] px-2">
                Manage your practice with <span className="text-[#3a749b]">precision</span> & <span className="text-[#f57c73]">clarity</span>.
              </h1>
              
              <p className="text-[14px] sm:text-lg md:text-xl text-white/70 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto px-4">
                Streamline compliance, automate workflows, and manage client communications from a single, unified workspace designed specifically for modern accounting firms.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-6">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-[#3a749b] hover:bg-[#2d5a7a] text-white px-8 py-3.5 rounded-xl text-[14px] sm:text-[15px] font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Start your free trial <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3.5 rounded-xl text-[14px] sm:text-[15px] font-medium transition-all shadow-sm hover:shadow flex items-center justify-center w-full sm:w-auto"
                >
                  Book a Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12 sm:mt-20 relative mx-auto max-w-6xl z-10 px-4 sm:px-0"
        >
          <div className="absolute -top-6 sm:-top-10 left-1/2 -translate-x-1/2 bg-[#3a749b] text-white px-3 sm:px-4 py-1 rounded-full text-[9px] sm:text-[11px] font-bold tracking-widest uppercase shadow-lg z-20 whitespace-nowrap">
            Dashboard Preview
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0d1117] p-1 sm:p-1.5 ring-1 ring-white/10">
            <div className="relative group">
              <div className="rounded-lg sm:rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] aspect-[16/10] flex flex-col shadow-inner">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">Everything you need to run your firm</h2>
            <p className="text-[15px] text-gray-600 max-w-2xl mx-auto">A complete suite of tools designed to handle the complexities of tax, audit, and accounting workflows.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <BarChart3 size={22} />, title: 'Workflow Automation', desc: 'Automate repetitive tasks and standardize your firm\'s processes with customizable workflows.', color: 'text-[#3a749b]', bg: 'bg-[#3a749b]/10' },
              { icon: <ShieldCheck size={22} />, title: 'Secure Document Vault', desc: 'Store, organize, and share sensitive client documents with enterprise-grade security.', color: 'text-[#f57c73]', bg: 'bg-[#f57c73]/10' },
              { icon: <Users size={22} />, title: 'Client Management', desc: 'Keep track of all client interactions, deadlines, and deliverables in one centralized hub.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: <Zap size={22} />, title: 'Deadline Tracking', desc: 'Never miss a statutory deadline with automated reminders and compliance tracking.', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: <CheckCircle2 size={22} />, title: 'Task Management', desc: 'Assign tasks, track progress, and collaborate with your team seamlessly.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: <Building2 size={22} />, title: 'Firm Analytics', desc: 'Gain insights into your firm\'s productivity, billable hours, and identify bottlenecks.', color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map((feature, i) => (
              <div key={i} className="bg-[#f4f5f7] p-8 rounded-2xl border border-gray-200/60 hover:border-gray-300 transition-colors group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0d1117] text-white relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3a749b]/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#f57c73]/20 blur-[120px]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">Ready to transform your practice?</h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">Join hundreds of tax professionals who have streamlined their operations with KDK Practice Suite.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-[#0d1117] hover:bg-gray-100 px-8 py-4 rounded-xl text-[15px] font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-200">
              <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M 12 12 L 38 12 L 12 64 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
                <path d="M 55 12 L 88 12 L 88 43 L 18 85 Z" fill="#f57c73" stroke="#f57c73" strokeWidth="8" strokeLinejoin="round" />
                <path d="M 42 88 L 88 60 L 88 88 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-serif text-sm font-bold tracking-tight text-gray-900 leading-none">KDK Practice</div>
              <div className="text-[8px] text-gray-500 tracking-widest uppercase mt-0.5">Suite</div>
            </div>
          </div>
          <p className="mb-6 text-[13px] text-gray-500">© {new Date().getFullYear()} KDK Practice Suite. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-[13px] font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
