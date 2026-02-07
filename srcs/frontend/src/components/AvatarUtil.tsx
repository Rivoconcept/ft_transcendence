import { useAtomValue } from "jotai";
import {
    userErrorFamilyProvider,
    userFamilyProvider,
    userLoadingFamilyProvider
} from "../providers";
import "./AvatarUtil.css";

export default function AvatarUtil({id, radius}: {id: number, radius: number}) {
    const user = useAtomValue(userFamilyProvider(id));
    const userLoading = useAtomValue(userLoadingFamilyProvider(id));
    const userError = useAtomValue(userErrorFamilyProvider(id));

    if (!user) {
        return (
            <div className="avatar skeleton" style={{ height: radius, width: radius }} />
        );
    }
    const classNames = ['avatar'];
    if (user.is_online)
        classNames.push('online');
    if (!user?.avatar)
        return (
            <div className={classNames.join(' ')}>
                {user!.username.charAt(0).toUpperCase()}
            </div>
        );
    
    return (
        <div className={classNames.join(' ')} style={{background: 'transparent', overflow: 'hidden'}} >
            <img src={user.avatar} alt={user.username} />
        </div>
    );
}