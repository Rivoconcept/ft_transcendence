import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');

  const handleCreateRoom = () => {
    const fakeRoomId = Date.now().toString();
    navigate(`/games/${gameSlug}/multiplayer/lobby/${fakeRoomId}`);
  };

  return (
    <div className="container mt-5">
      <h2>Multiplayer Setup - {gameSlug}</h2>

      <div className="mt-4">
        <input
          className="form-control mb-3"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <button
          className="btn btn-success"
          onClick={handleCreateRoom}
          disabled={!roomName}
        >
          Create Room
        </button>
      </div>
    </div>
  );
}