import { Check, Layers, Clock } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { formatDurationTotal } from "../../lib/format";
import { progressAriaLabel, selectProgressStats } from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

export function ProgressPill() {
  // selectProgressStats builds a new object each call — useShallow caches
  // by field equality so React 19's getSnapshot does not loop forever.
  const stats = useAppStore(useShallow(selectProgressStats));
  const { total, done, remaining, totalSeconds, doneSeconds, remainingSeconds, percent, overall } =
    stats;
  const empty = total === 0;
  const fmt = formatDurationTotal;

  return (
    <div
      className={`progress-pill${empty ? " is-empty" : ""}`}
      tabIndex={0}
      aria-describedby="progressDropdown"
      title={overall ? "Overall progress" : "Course progress"}
      aria-label={progressAriaLabel(stats)}
    >
      <div className="progress-ring" aria-hidden="true">
        <svg viewBox="0 0 36 36">
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
      <span className="progress-pill-label">
        {overall ? `${percent}% overall` : `${percent}% complete`}
      </span>
      <div className="progress-dropdown" id="progressDropdown" role="tooltip">
        <table className="progress-table">
          <thead>
            <tr>
              <th scope="col" className="progress-table-corner" />
              <th scope="col">
                <span className="progress-col-label">
                  <Layers className="progress-col-icon" size={14} aria-hidden />
                  Total
                </span>
              </th>
              <th scope="col">
                <span className="progress-col-label">
                  <Check className="progress-col-icon" size={14} aria-hidden />
                  Completed
                </span>
              </th>
              <th scope="col">
                <span className="progress-col-label">
                  <Clock className="progress-col-icon" size={14} aria-hidden />
                  Remaining
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Lectures</th>
              <td>{total}</td>
              <td>{done}</td>
              <td>{remaining}</td>
            </tr>
            <tr>
              <th scope="row">Time</th>
              <td>{fmt(totalSeconds)}</td>
              <td>{fmt(doneSeconds)}</td>
              <td>{fmt(remainingSeconds)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
