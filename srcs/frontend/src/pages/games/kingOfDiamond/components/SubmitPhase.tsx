import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Send, Clock } from "lucide-react";
import { currentUserAtom } from "../../../../providers";
import {
  kodSubmittedAtom,
  kodSubmittedValueAtom,
  kodSubmitProgressAtom,
  kodPlayersAtom,
  kodErrorAtom,
  kodRoundNumberAtom,
} from "../../../../providers";
import { kodApiService } from "../../../../services";
import { NumberGrid } from "./NumberGrid";

interface SubmitPhaseProps {
  matchId: string;
}

export function SubmitPhase({ matchId }: SubmitPhaseProps) {
  const currentUser = useAtomValue(currentUserAtom);
  const submitted = useAtomValue(kodSubmittedAtom);
  const submittedValue = useAtomValue(kodSubmittedValueAtom);
  const progress = useAtomValue(kodSubmitProgressAtom);
  const players = useAtomValue(kodPlayersAtom);
  const roundNumber = useAtomValue(kodRoundNumberAtom);
  const setError = useSetAtom(kodErrorAtom);

  const [selected, setSelected] = useState<number>(50);
  const [loading, setLoading] = useState(false);

  const me = players.find((p) => p.userId === currentUser?.id);

  if (me && !me.isActive) {
    return (
      <div className="card">
        <div className="card-body text-center py-5 text-muted">
          <Clock size={32} className="mb-2 opacity-50" />
          <p className="mb-0">Vous êtes éliminé. Observez la partie.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (loading || submitted) return;
    setLoading(true);
    setError("");
    try {
      await kodApiService.submitChoice(matchId, selected);
      // Optimistic — server emits kod:choice-ack to confirm
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <span className="fw-semibold">Manche {roundNumber} — Choisissez</span>
        {submitted && (
          <span className="badge bg-success d-flex align-items-center gap-1">
            <Send size={11} /> Soumis
          </span>
        )}
      </div>

      <div className="card-body">
        {/* Selected value display */}
        <div className="text-center mb-3">
          <span
            className="display-4 fw-bold"
            style={{ color: "#dc3545", fontVariantNumeric: "tabular-nums" }}
          >
            {submitted ? submittedValue ?? selected : selected}
          </span>
        </div>

        {/* Number grid */}
        <NumberGrid selected={submitted ? (submittedValue ?? selected) : selected} onChange={setSelected} />

        {/* Submit / waiting */}
        {!submitted ? (
          <button
            className="btn btn-danger w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <Send size={15} />
            )}
            Confirmer ♦
          </button>
        ) : (
          <div className="mt-3">
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>En attente des joueurs</span>
              <span>{progress.count} / {progress.total}</span>
            </div>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                style={{
                  width: `${progress.total ? (progress.count / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
