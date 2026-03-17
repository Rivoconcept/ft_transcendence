import { useAtomValue } from "jotai";
import { kodSubmittedAtom } from "../../../../providers/";

interface NumberGridProps {
  selected: number;
  onChange: (value: number) => void;
}

/**
 * Number picker laid out as:
 *
 *  [ 0 ]
 *  [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ]
 *  [10 ][11 ] ... [19 ]
 *  ...
 *  [100]
 */
export function NumberGrid({ selected, onChange }: NumberGridProps) {
  const submitted = useAtomValue(kodSubmittedAtom);

  const btn = (n: number) => {
    const isSelected = selected === n;
    return (
      <button
        key={n}
        type="button"
        disabled={submitted}
        onClick={() => onChange(n)}
        style={{
          width: "100%",
          aspectRatio: "1",
          border: isSelected ? "2px solid #dc3545" : "1px solid #dee2e6",
          borderRadius: 6,
          background: isSelected ? "#dc3545" : "#fff",
          color: isSelected ? "#fff" : "#212529",
          fontWeight: isSelected ? 700 : 400,
          fontSize: 13,
          cursor: submitted ? "not-allowed" : "pointer",
          opacity: submitted ? 0.6 : 1,
          transition: "all 0.1s",
          padding: 0,
          lineHeight: 1,
        }}
      >
        {n}
      </button>
    );
  };

  // Build rows: 0 alone, then groups of 10 (1–9, 10–19, ..., 90–99), then 100 alone
  const rows: React.ReactNode[] = [];

  // Row 0: just "0"
  rows.push(
    <div
      key="row-0"
      style={{ display: "grid", gridTemplateColumns: "1fr 9fr", gap: 4, marginBottom: 4 }}
    >
      <div>{btn(0)}</div>
      <div /> {/* spacer */}
    </div>,
  );

  // Rows 1–10: 1-9, 10-19, ... 90-99
  for (let row = 0; row < 10; row++) {
    const start = row * 10 + 1;
    const end = Math.min(start + 9, 100);
    const cells = [];
    for (let n = start; n <= end; n++) cells.push(btn(n));

    rows.push(
      <div
        key={`row-${row + 1}`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
          gap: 4,
          marginBottom: 4,
        }}
      >
        {cells}
      </div>,
    );
  }

  return <div style={{ userSelect: "none" }}>{rows}</div>;
}
