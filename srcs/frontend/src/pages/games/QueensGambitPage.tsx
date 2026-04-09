import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QueensGambitPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <section className="queens-gambit-page">
      <div className="queens-gambit-page__backdrop" />

      <div className="queens-gambit-page__card">
        <div className="queens-gambit-page__badge">Coming Soon</div>
        <div className="queens-gambit-page__icon" aria-hidden="true">♛</div>

        <h1>The Queen&apos;s Gambit</h1>
        <p className="queens-gambit-page__lead">
          We&apos;re building a polished mind game centered on elegant risk, sharp reads,
          and tournament-level presentation.
        </p>

        <p className="queens-gambit-page__body">
          The concept is locked in, the experience is being shaped, and this title will
          join the arcade once it reaches the quality bar we want for competitive play.
        </p>

        <div className="queens-gambit-page__actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/games')}
          >
            Back to games
          </button>
        </div>
      </div>
    </section>
  );
}