import { Check, Clock, Layers } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { formatDurationTotal } from "../../lib/format";
import { progressAriaLabel, selectProgressStats } from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

export function ProgressPill() {
  const stats = useAppStore(useShallow(selectProgressStats));
  const {
    total,
    done,
    remaining,
    totalSeconds,
    doneSeconds,
    remainingSeconds,
    percent,
    overall,
  } = stats;
  const empty = total === 0;
  const fmt = formatDurationTotal;

  return (
    <div
      className="group relative flex cursor-default items-center gap-2 rounded-full px-2.5 py-1 text-[13px] font-semibold text-tb-text outline-none hover:bg-tb-hover focus-visible:bg-tb-hover"
      tabIndex={0}
      aria-describedby="progressDropdown"
      title={overall ? "Overall progress" : "Course progress"}
      aria-label={progressAriaLabel(stats)}
    >
      <div className="h-7 w-7" aria-hidden="true">
        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
          <path
            className="ring-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="ring-fill"
            strokeDasharray={`${percent}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      </div>
      <span className="max-[560px]:hidden">
        {overall ? `${percent}% overall` : `${percent}% complete`}
      </span>
      <div
        id="progressDropdown"
        role="tooltip"
        className={[
          "absolute top-[calc(100%+10px)] right-0 z-50 hidden rounded-md border border-border bg-elevated p-3 text-text shadow-pop",
          empty ? "" : "group-hover:block group-focus-within:block",
        ].join(" ")}
      >
        <table className="border-collapse whitespace-nowrap text-xs tabular-nums">
          <thead>
            <tr>
              <th scope="col" className="w-px px-0.5" />
              <th scope="col" className="border-b border-border px-3 pb-2 text-right text-[11px] font-semibold text-muted-2">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <Layers className="block shrink-0 text-muted-2" size={14} aria-hidden />
                  Total
                </span>
              </th>
              <th scope="col" className="border-b border-border px-3 pb-2 text-right text-[11px] font-semibold text-muted-2">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <Check className="block shrink-0 text-muted-2" size={14} aria-hidden />
                  Completed
                </span>
              </th>
              <th scope="col" className="border-b border-border px-3 pb-2 text-right text-[11px] font-semibold text-muted-2">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <Clock className="block shrink-0 text-muted-2" size={14} aria-hidden />
                  Remaining
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="pr-4 pl-0.5 text-left font-medium text-muted">
                Lectures
              </th>
              <td className="px-3 py-1.5 text-right font-bold text-text">{total}</td>
              <td className="px-3 py-1.5 text-right font-bold text-text">{done}</td>
              <td className="px-3 py-1.5 text-right font-bold text-text">{remaining}</td>
            </tr>
            <tr>
              <th scope="row" className="pr-4 pt-2.5 pl-0.5 text-left font-medium text-muted">
                Time
              </th>
              <td className="px-3 pt-2.5 text-right font-bold text-text">{fmt(totalSeconds)}</td>
              <td className="px-3 pt-2.5 text-right font-bold text-text">{fmt(doneSeconds)}</td>
              <td className="px-3 pt-2.5 text-right font-bold text-text">
                {fmt(remainingSeconds)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
