interface InfoItemProps {
  label: string;
  value: string;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="space-y-1">
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>
        {value}
      </p>
    </div>
  );
}
