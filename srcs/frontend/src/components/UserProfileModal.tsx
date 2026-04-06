import { useState, useEffect } from "react";
import { X } from "lucide-react";
import AvatarUtil from "./AvatarUtil";
import { userService } from "../services";

interface UserProfile {
	id: number;
	username: string;
	avatar: string;
	is_online: boolean;
	gamesPlayed: number;
	wins: number;
	losses: number;
}

interface UserProfileModalProps {
	userId: number;
	onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		userService.getUserProfile(userId)
			.then(setProfile)
			.catch(() => setProfile(null))
			.finally(() => setLoading(false));
	}, [userId]);

	return (
		<div
			className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
			style={{ zIndex: 1060, background: "rgba(0,0,0,0.4)" }}
			onClick={onClose}
		>
			<div
				className="rounded-3 shadow"
				style={{
					background: "var(--bg-surface)",
					border: "1px solid var(--border-color)",
					minWidth: 300,
					maxWidth: 380,
					overflow: "hidden",
				}}
				onClick={e => e.stopPropagation()}
			>
				<div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
					<span className="fw-semibold" style={{ fontSize: 15, color: "var(--app-text-primary)" }}>
						Profile
					</span>
					<button
						className="btn btn-sm p-0 border-0"
						onClick={onClose}
						style={{ lineHeight: 1 }}
					>
						<X size={18} style={{ color: "var(--app-text-secondary)" }} />
					</button>
				</div>

				<div className="d-flex flex-column align-items-center py-4 px-3">
					{loading ? (
						<p style={{ color: "var(--app-text-secondary)" }}>Loading...</p>
					) : profile ? (
						<>
							<AvatarUtil id={profile.id} radius={80} showStatus={true} />
							<h5 className="mt-3 mb-1" style={{ color: "var(--app-text-primary)" }}>
								{profile.username}
							</h5>
							<span style={{
								fontSize: 13,
								color: profile.is_online ? "#28a745" : "var(--app-text-secondary)",
								marginBottom: 16,
							}}>
								{profile.is_online ? "Online" : "Offline"}
							</span>

							<div className="d-flex gap-3 w-100 justify-content-center">
								<div className="text-center" style={{
									background: "var(--bg-surface-alt)",
									borderRadius: 8,
									padding: "12px 16px",
									minWidth: 75,
								}}>
									<div style={{ fontSize: 20, fontWeight: "bold", color: "var(--primary-color)" }}>
										{profile.gamesPlayed}
									</div>
									<div style={{ fontSize: 11, color: "var(--app-text-secondary)" }}>
										Games
									</div>
								</div>
								<div className="text-center" style={{
									background: "var(--bg-surface-alt)",
									borderRadius: 8,
									padding: "12px 16px",
									minWidth: 75,
								}}>
									<div style={{ fontSize: 20, fontWeight: "bold", color: "var(--primary-color)" }}>
										{profile.wins}
									</div>
									<div style={{ fontSize: 11, color: "var(--app-text-secondary)" }}>
										Wins
									</div>
								</div>
								<div className="text-center" style={{
									background: "var(--bg-surface-alt)",
									borderRadius: 8,
									padding: "12px 16px",
									minWidth: 75,
								}}>
									<div style={{ fontSize: 20, fontWeight: "bold", color: "var(--primary-color)" }}>
										{profile.losses}
									</div>
									<div style={{ fontSize: 11, color: "var(--app-text-secondary)" }}>
										Losses
									</div>
								</div>
							</div>
						</>
					) : (
						<p style={{ color: "var(--app-text-secondary)" }}>User not found</p>
					)}
				</div>
			</div>
		</div>
	);
}
