import React, { useState } from 'react';
import { ShiftStats } from '../../components/supervisor/ShiftStats';
import { ControlPanel } from '../../components/supervisor/ControlPanel';
import { WorkflowSynoptic } from '../../components/supervisor/WorkflowSynoptic';
import { RecentOutDrawer } from '../../components/supervisor/RecentOutDrawer';
import { History, Activity } from 'lucide-react';
import { Button } from '../../components/atoms/ui/button';

export default function SupervisorTactical() {
  const [entriesSuspended, setEntriesSuspended] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Session Stats Bar */}
      <ShiftStats />

      {/* Control Panel / Regulation Center */}
      <div className="relative group">
        <ControlPanel 
          onSearch={setSearchQuery} 
          onToggleEntrées={setEntriesSuspended}
          entriesSuspended={entriesSuspended}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
      </div>

      {/* Main Synoptic View */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Synoptique Temps Réel</h2>
        </div>

        {entriesSuspended && (
          <div className="absolute inset-0 z-30 bg-red-500/5 backdrop-blur-[2px] pointer-events-none rounded-[2.5rem] border-4 border-red-500/20 border-dashed animate-pulse flex items-center justify-center">
            <div className="bg-red-500 text-white px-8 py-3 rounded-full font-black text-xl tracking-[0.2em] uppercase shadow-2xl shadow-red-500/20">
              ⚠️ Entrées Interrompues
            </div>
          </div>
        )}
        <WorkflowSynoptic />
      </div>

      {/* History Drawer */}
      <RecentOutDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      {/* Modern Footer Note */}
      <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        <div className="flex items-center gap-4">
          <span>GesParc V3 // SITE OPS</span>
          <span className="w-1 h-1 rounded-full bg-slate-200" />
          <span>v2.4.0</span>
        </div>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Data Stream Online
        </span>
      </div>
    </div>
  );
}
