import React from 'react';
import { Truck, Clock, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subValue?: string;
}

const StatCard = ({ label, value, icon: Icon, color, subValue }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/80 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-xl shadow-black/5 flex items-center gap-5"
  >
    <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
        {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
  </motion.div>
);

export function ShiftStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard 
        label="Tickets Site" 
        value="124" 
        subValue="+12%"
        icon={Truck} 
        color="bg-emerald-500" 
      />
      <StatCard 
        label="Attente Moy." 
        value="18" 
        subValue="min"
        icon={Clock} 
        color="bg-indigo-500" 
      />
      <StatCard 
        label="Flux Horaire" 
        value="12" 
        subValue="v/h"
        icon={Zap} 
        color="bg-amber-500" 
      />
      <StatCard 
        label="Présence" 
        value="42" 
        subValue="camions"
        icon={Users} 
        color="bg-blue-500" 
      />
    </div>
  );
}
