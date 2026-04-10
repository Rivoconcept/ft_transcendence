// /home/rhanitra/Pictures/ft_transcendence/srcs/frontend/src/components/AvatarUtil.tsx
import { useAtomValue } from "jotai";
import { userFamily } from "../providers";
import "./AvatarUtil.css";
import UserProfileModal from "./UserProfileModal";
import { useState } from "react";

interface AvatarUtilProps {
    id: number;
    radius: number; // Note: represents diameter, not radius
    showStatus?: boolean;
    hasInfo?: boolean;
}

export default function AvatarUtil({ id, radius, showStatus = true, hasInfo = false }: AvatarUtilProps) {
    const userLoadable = useAtomValue(userFamily(id));
    const [showInfo, setShowInfo] = useState(false);

    // Indicator size proportional to avatar (about 20% of diameter, min 10px, max 20px)
    const indicatorSize = Math.min(Math.max(radius * 0.2, 10), 20);

    // Loading state
    if (userLoadable.state === 'loading') {
        return (
            <div className="avatar-container" >
                <div className="avatar skeleton" style={{ height: radius, width: radius }} />
            </div>
        );
    }

    // Error state
    if (userLoadable.state === 'hasError') {
        return (
            <div className="avatar-container" >
                <div className="avatar error" style={{ height: radius, width: radius }}>?</div>
            </div>
        );
    }

    // Has data
    const user = userLoadable.data;

    return (
        <>
            <div className="avatar-container" onClick={() => setShowInfo(true)} style={{ position: 'relative', cursor: hasInfo ? 'pointer' : 'default' }}>
                {user?.avatar ? (
                    <div className="avatar" style={{ height: radius, width: radius, background: 'transparent', overflow: 'hidden' }}>
                        <img src={user.avatar} alt={user.username} />
                    </div>
                ) : (
                    <div className="avatar" style={{ height: radius, width: radius, fontSize: radius * 0.4 }}>
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                )}
                {showStatus && user.is_online && (
                    <span
                        className="status-indicator online"
                        style={{
                            width: indicatorSize,
                            height: indicatorSize,
                        }}
                    />
                )}
            </div>
            {user?.id !== null && hasInfo && showInfo && (
                <UserProfileModal userId={user.id} onClose={() => setShowInfo(false)} />
            )}
        </>
    );
}
