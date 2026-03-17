import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "../../../providers/index";
import { socketStore } from "../../../store/socketStore";
import { apiService } from "../../../services/api.service";

import { KodProvider, kodPhaseAtom, kodRoundNumberAtom, kodErrorAtom } from "../../../providers/kod.provider";
import { Scoreboard } from "./components/Scoreboard";
import { SubmitPhase } from "./components/SubmitPhase";
import { RevealPhase } from "./components/RevealPhase";
import { GameOver } from "./components/GameOver";

// ─── Inner page (needs atoms already in scope) ────────────────────────────────
function KingOfDiamondInner({ matchId }: { matchId: string }) {
	const phase = useAtomValue(kodPhaseAtom);
	const roundNumber = useAtomValue(kodRoundNumberAtom);
	const error = useAtomValue(kodErrorAtom);

	return (
		<div className="container py-4" style={{ maxWidth: 760 }}>

			{/* Header */}
			<div className="d-flex align-items-center justify-content-between mb-3">
				<h4 className="mb-0 d-flex align-items-center gap-2">
					♦ <span>Roi de Carreaux</span>
					{phase !== "over" && phase !== "waiting" && (
						<span className="badge bg-secondary fw-normal fs-6">
							Manche {roundNumber}
						</span>
					)}
				</h4>
				<span className="text-muted small font-monospace">{matchId}</span>
			</div>

			{/* Error toast */}
			{error && (
				<div className="alert alert-danger py-2 small">{error}</div>
			)}

			<div className="row g-3">

				{/* Scoreboard */}
				<div className="col-md-4">
					<Scoreboard />
				</div>

				{/* Action area */}
				<div className="col-md-8">
					{phase === "waiting" && <WaitingPanel />}
					{phase === "submitting" && <SubmitPhase matchId={matchId} />}
					{phase === "revealing" && <RevealPhase />}
					{phase === "over" && <GameOver />}
				</div>

			</div>
		</div>
	);
}

// ─── Waiting panel ────────────────────────────────────────────────────────────
function WaitingPanel() {
	return (
		<div className="card">
			<div className="card-body text-center py-5 text-muted">
				<div className="spinner-border text-secondary mb-3" />
				<p className="mb-0">En attente du démarrage…</p>
			</div>
		</div>
	);
}

// ─── Page root — auth guard + socket connection + provider ───────────────────
export default function KingOfDiamond() {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();
	const currentUser = useAtomValue(currentUserAtom);

	// Auth guard + ensure socket is connected
	useEffect(() => {
		if (!currentUser) { navigate("/login"); return; }

		const token = apiService.getToken();
		if (!token) { navigate("/login"); return; }

		socketStore.connectAndAuth(token);
	}, [currentUser, navigate]);

	if (!roomId) return null;

	return (
		<KodProvider matchId={roomId}>
			<KingOfDiamondInner matchId={roomId} />
		</KodProvider>
	);
}
