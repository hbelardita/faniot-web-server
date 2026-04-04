import React from 'react';

interface InfoItemProps {
  label: string;
  value: string;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-bold text-slate-700">{value}</p>
    </div>
  );
}
