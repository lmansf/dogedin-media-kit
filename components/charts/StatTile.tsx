// A single headline number in a sticker card. The value stays in the body
// sans (never the display serif) and in ink — data color belongs to marks,
// not text.
export default function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border-[3px] border-black bg-white p-4 shadow-hard">
      <p className="text-xs font-black uppercase tracking-wide text-black/50">
        {label}
      </p>
      <p className="mt-1 text-4xl font-black leading-none">{value}</p>
      {hint && <p className="mt-2 text-xs font-bold text-black/50">{hint}</p>}
    </div>
  );
}
