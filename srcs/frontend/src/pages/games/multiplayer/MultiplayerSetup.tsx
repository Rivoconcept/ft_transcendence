import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface RoomNameInputProps {
  value: string;
  onChange: (val: string) => void;
  gameSlug: string;
  roomName: string;
}

function RoomNameInput({ value, onChange, gameSlug, roomName }: RoomNameInputProps) {

  const navigate = useNavigate();
  const handleCreateRoom = () => {
    const fakeRoomId = Date.now().toString();
    navigate(`/games/${gameSlug}/multiplayer/lobby/${fakeRoomId}`);
  };

  return (
    <div className="container mt-5">
      <h2>Multiplayer Setup: {gameSlug}</h2>
      <input
        className="form-control mb-3"
        placeholder="Room name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="mt-4">
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

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const [roomName, setRoomName] = useState('');

  return (
    <RoomNameInput
      value={roomName}
      onChange={setRoomName}
      gameSlug={gameSlug || ''}
      roomName={roomName}
    />
  );
}