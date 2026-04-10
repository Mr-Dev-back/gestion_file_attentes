import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export interface TimerProps {
  startedAt: string | Date;
  className?: string;
}

export const Timer = ({ startedAt, className }: TimerProps) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) {
        setElapsed('00:00');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      const parts = [];
      if (h > 0) parts.push(h.toString().padStart(2, '0'));
      parts.push(m.toString().padStart(2, '0'));
      parts.push(s.toString().padStart(2, '0'));

      setElapsed(parts.join(':'));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (className) {
    return <span className={className}>{elapsed}</span>;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-mono text-lg shadow-inner">
      <Clock className="h-4 w-4 text-primary animate-pulse" />
      {elapsed}
    </div>
  );
};
