import type { SlotEDT } from "@/types";
import { CRENEAUX, JOURS } from "@/data/mock";

const typeStyles: Record<SlotEDT["type"], string> = {
  CM: "bg-emit-navy text-white",
  TD: "bg-sky-200 text-sky-900",
  TP: "bg-green-200 text-green-900",
};

type Block = { slot: SlotEDT; span: number };

// Pour un jour donné, regroupe les créneaux consécutifs identiques (même cours,
// même enseignant, même salle, et réellement contigus dans le temps) en un seul bloc.
function buildDayBlocks(slots: SlotEDT[], jour: string): (Block | null)[] {
  const parCreneau: (SlotEDT | undefined)[] = CRENEAUX.map((c) => {
    const [debut] = c.split(" - ");
    return slots.find((s) => s.jour === jour && s.debut === debut);
  });

  const result: (Block | null)[] = new Array(CRENEAUX.length).fill(null);
  const skip = new Set<number>();

  for (let i = 0; i < parCreneau.length; i++) {
    if (skip.has(i)) continue;
    const s = parCreneau[i];
    if (!s) continue;

    let span = 1;
    let finActuelle = CRENEAUX[i].split(" - ")[1];
    for (let j = i + 1; j < parCreneau.length; j++) {
      const next = parCreneau[j];
      const [debutSuivant] = CRENEAUX[j].split(" - ");
      if (
        next &&
        next.coursId === s.coursId &&
        next.enseignant === s.enseignant &&
        next.salle === s.salle &&
        debutSuivant === finActuelle // vraiment contigu (saute le trou du déjeuner)
      ) {
        span++;
        skip.add(j);
        finActuelle = CRENEAUX[j].split(" - ")[1];
      } else {
        break;
      }
    }
    result[i] = { slot: s, span };
  }
  return result;
}

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

  // Blocs (avec rowSpan) précalculés par jour
  const blocksParJour: Record<string, (Block | null)[]> = {};
  for (const j of JOURS) blocksParJour[j] = buildDayBlocks(slots, j);

  // Lignes couvertes par un rowSpan précédent, par jour — pour ne pas re-render une <td>
  const couvertes: Record<string, Set<number>> = {};
  for (const j of JOURS) {
    couvertes[j] = new Set();
    blocksParJour[j].forEach((b, i) => {
      if (b) for (let k = i + 1; k < i + b.span; k++) couvertes[j].add(k);
    });
  }

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
          {CRENEAUX.map((c, rowIdx) => (
            <tr key={c}>
              <td className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 text-xs font-mono text-slate-600">
                {c}
              </td>
              {JOURS.map((j, i) => {
                if (couvertes[j].has(rowIdx)) return null; // fusionnée dans la cellule au-dessus
                const block = blocksParJour[j][rowIdx];
                return (
                  <td
                    key={j}
                    rowSpan={block?.span ?? 1}
                    className={`border-b border-l border-slate-100 align-top ${
                      i === todayIdx ? "bg-emit-light/30" : ""
                    }`}
                  >
                    {block ? (
                      <button
                        onClick={() => onClickSlot?.(block.slot)}
                        className={`m-1 w-[calc(100%-0.5rem)] rounded-md px-2 py-1.5 text-left text-xs ${typeStyles[block.slot.type]} hover:opacity-90`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{block.slot.type}</span>
                          <span className="opacity-80">{block.slot.salle}</span>
                        </div>
                        <p className="mt-0.5 truncate font-medium">{block.slot.intitule}</p>
                        <p className="truncate opacity-80">{block.slot.enseignant}</p>
                        {block.span > 1 && (
                          <p className="mt-0.5 text-[10px] opacity-70">
                            {block.slot.debut} - {CRENEAUX[rowIdx + block.span - 1].split(" - ")[1]}
                          </p>
                        )}
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