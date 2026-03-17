import "reflect-metadata";
import { createServer } from "http";
import { AppDataSource } from "./database/data-source.js";
import { socketService } from "./websocket.js";
import app from "./app.js";
import { Game } from "./database/entities/game.js";

const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

async function seedGames() {
	const gameRepo = AppDataSource.getRepository(Game);

	const count = await gameRepo.count();

	// Avoid inserting duplicates
	if (count === 0) {
		const games = gameRepo.create([
			{ name: "Dice Game" },
			{ name: "King of Diamond" },
			{ name: "Card Game" },
		]);

		await gameRepo.save(games);

		console.log("Game seed data inserted");
	}
}

AppDataSource.initialize()
	.then(async () => {
		console.log("Database connected");

		await seedGames();

		socketService.init(httpServer);

		httpServer.listen(PORT, () => {
			console.log(`Backend running on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Database connection failed:", error);
		process.exit(1);
	});




/**
1. The cardGameRoutes — what are they exactly?
@Entity()
export class CardGame {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "enum", enum: CardGameMode, default: CardGameMode.SINGLE })
	mode!: CardGameMode;

	@Column({ type: "varchar", length: 255, nullable: true })
	player_name?: string; 

	@Column({ type: "int", default: 0 })
	final_score!: number;

	@Column({ default: false })
	is_win!: boolean;

	@Column({ type: "char", length: 4, nullable: true })
	match_id!: string | null;

	@Column()
	author_id!: number;

	@ManyToOne("User", "card_games")
	@JoinColumn({ name: "author_id" })
	author!: Relation<User>;

	@CreateDateColumn()
	created_at!: Date;
}
there is the only card game entity CardGame that has nothind to do with other game and do not reuse other games routes. add new route like 
app.use("/api/kod", KingOfDiamondRoutes);

2. Score initialization
I set score = 10 when the game starts (via a dedicated init step)

3. Eliminated players
infer elimination from score === 0

4. The existing lobby/match screens
MULTYPLAYER SETUP:

export default function MultiplayerSetup(): React.JSX.Element {
	const { gameSlug } = useParams();
	const navigate = useNavigate();

	const currentUser = useAtomValue(currentUserAtom);
	const setPlayerName = useSetAtom(playerNameAtom);

	const [isCreateRoom, setIsCreateRoom] = useState(true);
	const [roomCode, setRoomCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const BACKEND_URL =
		import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

	const gameMap: Record<string, number> = {
		"dice-game": 1,
		"king-of-diamond": 2,
		"card-game": 3,
	};

	const getGameId = (slug: string | undefined): number =>
		gameMap[slug || ""] || 1;

	if (!currentUser) {
		return (
			<div className="container mt-5">
				<div className="alert alert-danger text-center">
					Vous devez être connecté pour jouer en multiplayer.
				</div>
			</div>
		);
	}

	const playerName = currentUser.username;

	const handleCreateRoom = async (event: React.FormEvent) => {
		event.preventDefault();

		setLoading(true);
		setError("");

		try {
			const token = apiService.getToken();

			if (!token) {
				throw new Error("Token manquant. Veuillez vous reconnecter.");
			}

			console.log("TOKEN:", token);

			const game_id = getGameId(gameSlug);

			const response = await fetch(`${BACKEND_URL}/api/matches`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					is_private: false,
					set: 1,
					game_id,
					player_name: playerName,
				}),
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(text);
			}

			const data = await response.json();

			setPlayerName(playerName);

			navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Erreur création salle");
		} finally {
			setLoading(false);
		}
	};

	const handleJoinRoom = async (event: React.FormEvent) => {
		event.preventDefault();

		setLoading(true);
		setError("");

		try {
			const token = apiService.getToken();

			if (!token) {
				throw new Error("Token manquant. Veuillez vous reconnecter.");
			}

			const response = await fetch(`${BACKEND_URL}/api/matches/${roomCode}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(text);
			}

			const data = await response.json();

			setPlayerName(playerName);

			navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Erreur récupération salle");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mt-5">
			<div className="mx-auto" style={{ maxWidth: 500 }}>
				<h2 className="text-center mb-4">
					Multiplayer Setup : {gameSlug}
				</h2>

				<div className="alert alert-info text-center">
					Connecté en tant que <strong>{playerName}</strong>
				</div>

				<div className="d-flex justify-content-center mb-4">
					<button
						className={`btn me-2 ${isCreateRoom ? "btn-success" : "btn-outline-success"
							}`}
						onClick={() => setIsCreateRoom(true)}
					>
						Créer Salle
					</button>

					<button
						className={`btn ${!isCreateRoom ? "btn-success" : "btn-outline-success"
							}`}
						onClick={() => setIsCreateRoom(false)}
					>
						Rejoindre Salle
					</button>
				</div>

				{error && <div className="alert alert-danger">{error}</div>}

				{isCreateRoom && (
					<form onSubmit={handleCreateRoom}>
						<button className="btn btn-success w-100" disabled={loading}>
							{loading ? "Création..." : "Créer Salle"}
						</button>
					</form>
				)}

				{!isCreateRoom && (
					<form onSubmit={handleJoinRoom}>
						<div className="mb-3">
							<label className="form-label">Code de la Salle</label>
							<input
								className="form-control"
								value={roomCode}
								onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
								placeholder="ABCD"
							/>
						</div>

						<button className="btn btn-success w-100" disabled={loading}>
							{loading ? "Connexion..." : "Rejoindre Salle"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}

LOBBY:
interface Player {
	id: number;
	name: string;
	ready: boolean;
}

export default function MultiplayerLobby(): React.JSX.Element {
	const { gameSlug, roomId } = useParams();
	const navigate = useNavigate();

	const playerName = useAtomValue(playerNameAtom);
	const currentUser = useAtomValue(currentUserAtom);

	const [players, setPlayers] = useState<Player[]>([]);
	const [isCreator, setIsCreator] = useState(false);
	const [me, setMe] = useState<Player | null>(null);

	useEffect(() => {
		if (!roomId || !currentUser) return;

		const token = apiService.getToken();
		if (!token) {
			navigate(`/games/${gameSlug}/multiplayer/setup`);
			return;
		}

		socketStore.connectAndAuth(token);
		const socket = socketStore.getSocket();
		if (!socket) return;

		const joinRoom = () => {
			console.log("Join match room:", roomId);

			socket.emit("joinMatchRoom", {
				matchId: roomId,
				playerName,
			});
		};

		const handlePlayers = (data: { participants: Player[]; creatorId: number }) => {
			setPlayers(data.participants);

			const userId = currentUser.id;

			const currentPlayer =
				data.participants.find((p) => p.id === userId) || null;

			setMe(currentPlayer);

			setIsCreator(data.creatorId === userId);
		};

		const handleStart = () => {
			navigate(`/games/${gameSlug}/${roomId}/play`);
		};

		if (socket.connected) joinRoom();

		socket.on("connect", joinRoom);
		socket.on("match:player-joined", handlePlayers);
		socket.on("match:started", handleStart);

		return () => {
			socket.off("connect", joinRoom);
			socket.off("match:player-joined", handlePlayers);
			socket.off("match:started", handleStart);
		};
	}, [roomId, gameSlug, navigate, playerName, currentUser]);

	const startGame = () => {
		const socket = socketStore.getSocket();

		if (socket && roomId) {
			socket.emit("startMatch", { matchId: roomId });
		}
	};

	return (
		<div className="container mt-5">
			<div className="card shadow p-4 mx-auto" style={{ maxWidth: 500 }}>
				<h2 className="text-center mb-4">Lobby : {roomId}</h2>

				<h5>Joueurs ({players.length})</h5>

				<ul className="list-group mb-4">
					{players.map((player) => (
						<li
							key={player.id}
							className="list-group-item d-flex justify-content-between align-items-center"
						>
							{player.name} {me?.id === player.id && "(vous)"}

							{player.ready && (
								<span className="badge bg-success">Prêt</span>
							)}
						</li>
					))}
				</ul>

				{players.length === 0 && (
					<div className="alert alert-warning text-center">
						En attente de joueurs...
					</div>
				)}

				{isCreator && players.length > 1 && (
					<button className="btn btn-success w-100" onClick={startGame}>
						Lancer le jeu
					</button>
				)}

				{!isCreator && players.length > 0 && (
					<div className="alert alert-info text-center">
						En attente du créateur...
					</div>
				)}
			</div>
		</div>
	);
}
	
5. JWT shape
export interface JWTPayload {
	userId: number;
	username: string;
}


*/