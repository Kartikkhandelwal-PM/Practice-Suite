import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysLeft, fmtDate, TYPE_COLORS } from '../utils';
import { TypeChip } from '../components/ui/Badges';
import { PageHeader } from '../components/ui/PageHeader';
import { FileText, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function CompliancePage() {
  const { deadlines } = useApp();
  const [filter, setFilter] = useState('');
  
  const CATS = ['GST', 'TDS', 'ITR', 'ROC', 'Advance Tax', 'Labour', 'MCA'];
  const filtered = deadlines.filter(d => !filter || d.category === filter);

  return (
    <div className="animate-slide-up">
      <PageHeader 
        title="Compliance Master" 
        description="All statutory deadlines and filing schedules"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${filter === '' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setFilter('')}
        >
          All
        </button>
        {CATS.map(c => (
          <button 
            key={c} 
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${filter === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Compliance</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Form</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Section</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Clients</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-gray-700">
            {filtered.map(d => {
              const dl = daysLeft(d.dueDate);
              const urgent = dl !== null && dl <= 3 && dl >= 0;
              const overdue = dl !== null && dl < 0;
              
              return (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[13px] text-gray-900">{d.title}</div>
                    <div className="text-[11.5px] text-gray-500 mt-0.5">{d.desc}</div>
                  </td>
                  <td className="px-4 py-3"><TypeChip type={d.category} /></td>
                  <td className="px-4 py-3 text-[12px] font-mono font-semibold">{d.form}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{d.section}</td>
                  <td className="px-4 py-3">
                    <div className={`font-semibold text-[13px] ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-900'}`}>
                      {fmtDate(d.dueDate)}
                    </div>
                    {dl !== null && (
                      <div className={`text-[11px] mt-0.5 ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                        {overdue ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d remaining`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[14px]">{d.clients}</div>
                    <div className="text-[11px] text-gray-400">clients</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${overdue ? 'bg-red-50 text-red-600' : urgent ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {overdue ? 'Overdue' : urgent ? 'Urgent' : 'On Track'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
