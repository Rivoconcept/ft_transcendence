import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface CreateRoomSetupProps {
  roomName: string;
  is_open: boolean;
  set?: number;
  gameSlug: string;
}

function CreateRoomSetup({ roomName, is_open, set, gameSlug }: CreateRoomSetupProps) {
  const navigate = useNavigate();

  // State to store form values, with type annotations
  const [formData, setFormData] = useState({
    roomName: roomName,
    is_open: is_open,
    set: set ?? 1,
    gameSlug: gameSlug,
  });

  // Handle input changes with type annotation for event
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleCreateRoom = (event: React.FormEvent) => {
    event.preventDefault();
    const fakeRoomId = Date.now().toString();
    navigate(`/games/${gameSlug}/multiplayer/lobby/${fakeRoomId}`);
  };

  return (
    <div className="container mt-5">
      <h2>Multiplayer Setup: {gameSlug}</h2>

      <form onSubmit={handleCreateRoom} className="mt-4">

        <div>
          <label>Name:</label>
          <input
            type="text"
            name="roomName"
            value={formData.roomName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Is Open:</label>
          <input
            type="checkbox"
            name="is_open"
            checked={formData.is_open}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Set:</label>
          <input
            type="number"
            name="set"
            value={formData.set}
            onChange={handleChange}
          />
        </div>

        <button className="btn btn-success" type="submit">Create Room</button>
      </form>
    </div>
  );
}

interface JoinRoomSetupProps {
  // Define any props needed for joining a room
  roomName: string;
  RoomCode: string;
  gameSlug: string;
}


function JoinRoomSetup({ roomName, RoomCode, gameSlug }: JoinRoomSetupProps) {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState<string>(RoomCode);

  // Handle input changes with type annotation for event
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setRoomCode(value);
  };


  // Handle form submission
  const handleJoinRoom = (event: React.FormEvent) => {
    event.preventDefault();
    const fakeRoomId = Date.now().toString();
    navigate(`/games/${gameSlug}/multiplayer/lobby/${fakeRoomId}`);
  };

  return (
    <div className="container mt-5">
      <h2>Join Room: {gameSlug}</h2>

      <form onSubmit={handleJoinRoom} className="mt-4">
        <div>
          <label>Room Code:</label>
          <input
            type="text"
            name="RoomCode"
            value={roomCode}
            onChange={handleChange}
          />
        </div>
        <button className="btn btn-primary" type="submit">Join Room</button>
      </form>
    </div>
  );
}

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const [roomName, setRoomName] = useState('');
  const [isCreateRoom, setIsCreateRoom] = useState<boolean>(true);

  return (

    <div className="auth-container">
      <div className="auth-tabs">
        <button
          className={`tab-btn ${isCreateRoom ? 'active' : ''}`}
          onClick={() => setIsCreateRoom(true)}
        >
          Create Room
        </button>
        <button
          className={`tab-btn ${!isCreateRoom ? 'active' : ''}`}
          onClick={() => setIsCreateRoom(false)}
        >
          Join Room
        </button>
      </div>

      {isCreateRoom ?
        <CreateRoomSetup
          roomName={roomName}
          is_open={true}
          set={1}
          gameSlug={gameSlug || ''}
        />
        :
        <JoinRoomSetup
          roomName={roomName}
          RoomCode=""
          gameSlug={gameSlug || ''}
        />
      }
    </div>
  );
}