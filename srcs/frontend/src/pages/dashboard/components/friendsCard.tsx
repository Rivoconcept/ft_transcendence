import { useAtom } from 'jotai';
import { friendsAtom } from '../providers/friendsAtom';
import * as Tooltip from '@radix-ui/react-tooltip'; 
import '../Dashboard.scss';

export default function FriendsCard() {
  const [friends] = useAtom(friendsAtom);

  const total = friends.length;
  const onlineFriends = friends.filter(f => f.online);
  const offlineFriends = friends.filter(f => !f.online);

  const renderPreview = (list: typeof friends, label: string) => {
  if (list.length === 0) return '—';

  const previewText =
    list.slice(0, 3).map(f => f.name).join(', ') +
    (list.length > 3 ? ', …' : '');

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="friends-preview">
            {previewText}
          </span>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            className="tooltip-content"
            side="top"
            align="start"
          >
            <strong>{label}</strong>
            <ul>
              {list.map(friend => (
                <li key={friend.id}>{friend.name}</li>
              ))}
            </ul>
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

  return (
    <div className="dashboard-card">
      <h3>Friends</h3>
      <div className="friends-total">
        Total: {total}
      </div>
      <div className="friends-status">
        <div className="status-group">
          <span className="status-dot online"></span>
          <span className="status-text">
            Online: {onlineFriends.length} ({renderPreview(onlineFriends, 'Online Friends')})
          </span>
        </div>
        <div className="status-group">
          <span className="status-dot offline"></span>
          <span className="status-text">
            Offline: {offlineFriends.length} ({renderPreview(offlineFriends, 'Offline Friends')})
          </span>
        </div>
      </div>
    </div>
  );
}