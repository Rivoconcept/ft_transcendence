import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameModeAtom } from "../cardGame/cardAtoms/gameMode.atom";
import { useAtom } from "jotai";

const gamesConfig = {
  kingOfDiamond: {
    name: '#️⃣ King Of Diamond',
    description: (
      <>
        <p className="lead">
          Pick a number between 1 and 100. Strategy is key!
        </p>
        <p>
          Try to guess the right number while minimizing your attempts.
          Every choice matters!
        </p>
        <p>
          🎯 Find the correct number.<br />
          🧠 Think strategically.<br />
          ⚡ Win in the fewest tries possible.
        </p>
      </>
    ),
  },

  cardGame: {
    name: '🃏 Card Game',
    description: (
      <>
        <p className="lead">
          Test your strategy and luck in this fast-paced card game!
        </p>

        <p>
          Draw cards, accumulate points, and try to reach the perfect score
          <strong> without going over the limit</strong>. Each round is a risk:
          push your luck or play it safe?
        </p>

        <p>
          ⏱ You have limited time and turns to maximize your score.<br />
          🎯 Reach the target score to win instantly.<br />
          💀 Go too far or run out of time… and you lose.
        </p>
      </>
    ),
  },
};

export default function GameSetup(): React.JSX.Element {
  const navigate = useNavigate();
  const { gameSlug } = useParams();
  const [mode, setMode] = useAtom(gameModeAtom);

  const game = gamesConfig[gameSlug as keyof typeof gamesConfig];

  if (!game) {
    return <div className="text-center mt-5">Game not found</div>;
  }

  return (
    <div className="container mt-5">

      <div className="row justify-content-center">
        <div className="col-md-8">

          <div className="card shadow-lg border-0">

            <div className="card-header bg-dark text-white text-center">
              <h2 className="mb-0">{game.name}</h2>
            </div>

            <div className="card-body text-center">

              <div className="lead">{game.description}</div>

              <hr />

              <h5 className="mb-3">Choose your mode</h5>

              <div className="d-flex justify-content-center gap-3">

                {/* Multiplayer */}
                <button
                  className={`btn btn-outline-primary btn-lg ${mode === 'MULTI' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('MULTI');
                    navigate(`/games/${gameSlug}/multiplayer/setup`);
                  }}
                >
                  👥 Multiplayer
                </button>

                {/* Single */}
                <button
                  className={`btn btn-success btn-lg ${mode === 'SINGLE' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('SINGLE');
                    navigate(`/games/${gameSlug}/single`);
                  }}
                >
                  🧍 Single Player
                </button>

              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}