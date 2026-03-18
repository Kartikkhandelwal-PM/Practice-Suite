import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Building2, BarChart3, Menu, X, Users, Zap } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative bg-[#0d1117] text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3a749b]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#f57c73]/20 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm mb-8">
                <Sparkles size={14} className="text-[#f57c73]" />
                <span className="text-[12px] font-medium text-white/70">The modern operating system for CA & Tax Professionals</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white mb-6 leading-[1.1]">
                Manage your practice with <span className="text-[#3a749b]">precision</span> & <span className="text-[#f57c73]">clarity</span>.
              </h1>
              
              <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
                Streamline compliance, automate workflows, and manage client communications from a single, unified workspace designed specifically for modern accounting firms.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-[#3a749b] hover:bg-[#2d5a7a] text-white px-8 py-3.5 rounded-xl text-[15px] font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  Start your free trial <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3.5 rounded-xl text-[15px] font-medium transition-all shadow-sm hover:shadow flex items-center justify-center"
                >
                  Book a Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Dashboard Preview Image */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-6xl z-10"
        >
          <div className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-white/5 p-2">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/50">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="w-full h-auto object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
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
