import type { SlotEDT } from "@/types";
import { CRENEAUX, JOURS } from "@/data/mock";

const typeStyles: Record<SlotEDT["type"], string> = {
  CM: "bg-emit-navy text-white",
  TD: "bg-sky-200 text-sky-900",
  TP: "bg-green-200 text-green-900",
};

export default function WeeklyGrid({
  slots,
  onClickSlot,
  highlightToday,
}: {
  slots: SlotEDT[];
  onClickSlot?: (s: SlotEDT) => void;
  highlightToday?: boolean;
}) {
  const todayIdx = highlightToday ? Math.min(new Date().getDay() - 1, 4) : -1;

  const findSlot = (jour: string, creneau: string): SlotEDT | undefined => {
    const [debut] = creneau.split(" - ");
    return slots.find((s) => s.jour === jour && s.debut === debut);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-32 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-500">
              Créneau
            </th>
            {JOURS.map((j, i) => (
              <th
                key={j}
                className={`border-b border-l border-slate-200 px-3 py-2 text-left text-xs font-semibold ${
                  i === todayIdx ? "bg-emit-light text-emit-navy" : "bg-slate-50 text-slate-700"
                }`}
              >
                {j}
                {i === todayIdx && (
                  <span className="ml-1 rounded-full bg-emit-navy px-1.5 py-0.5 text-[10px] text-white">
                    Aujourd'hui
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRENEAUX.map((c) => (
            <tr key={c}>
              <td className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 text-xs font-mono text-slate-600">
                {c}
              </td>
              {JOURS.map((j, i) => {
                const slot = findSlot(j, c);
                return (
                  <td
                    key={j}
                    className={`border-b border-l border-slate-100 align-top ${
                      i === todayIdx ? "bg-emit-light/30" : ""
                    }`}
                  >
                    {slot ? (
                      <button
                        onClick={() => onClickSlot?.(slot)}
                        className={`m-1 w-[calc(100%-0.5rem)] rounded-md px-2 py-1.5 text-left text-xs ${typeStyles[slot.type]} hover:opacity-90`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{slot.type}</span>
                          <span className="opacity-80">{slot.salle}</span>
                        </div>
                        <p className="mt-0.5 truncate font-medium">{slot.intitule}</p>
                        <p className="truncate opacity-80">{slot.enseignant}</p>
                      </button>
                    ) : (
                      <div className="px-3 py-3 text-center text-xs text-slate-300">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
