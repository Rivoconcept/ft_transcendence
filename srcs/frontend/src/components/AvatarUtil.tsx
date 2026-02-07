import { useAtomValue } from "jotai";
import { userFamily } from "../providers";
import "./AvatarUtil.css";

export default function AvatarUtil({id, radius}: {id: number, radius: number}) {
    const userLoadable = useAtomValue(userFamily(id));

    // Loading state
    if (userLoadable.state === 'loading') {
        return (
            <div className="avatar skeleton" style={{ height: radius, width: radius }} />
        );
    }

    // Error state
    if (userLoadable.state === 'hasError') {
        return (
            <div className="avatar error" style={{ height: radius, width: radius }}>?</div>
        );
    }

    // Has data
    const user = userLoadable.data;
    const classNames = ['avatar'];
    if (user.is_online)
        classNames.push('online');
    if (!user?.avatar)
        return (
            <div className={classNames.join(' ')}>
                {user.username.charAt(0).toUpperCase()}
            </div>
        );

    return (
        <div className={classNames.join(' ')} style={{background: 'transparent', overflow: 'hidden'}} >
            <img src={user.avatar} alt={user.username} />
        </div>
    );
}
