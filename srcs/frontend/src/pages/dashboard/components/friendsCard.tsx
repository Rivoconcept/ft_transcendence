import { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { friendsAtom } from '../providers/friendsAtom';
import { fetchFriendsAtom, friendsLoadingAtom } from '../../../providers/friend.provider';
import * as Tooltip from '@radix-ui/react-tooltip';
import AvatarUtil from '../../../components/AvatarUtil';
import '../Dashboard.scss';

export default function FriendsCard() {
  const [friends] = useAtom(friendsAtom);
  const isLoading = useAtomValue(friendsLoadingAtom);
  const fetchFriends = useSetAtom(fetchFriendsAtom);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  const total = friends.length;
  const onlineFriends = friends.filter(f => f.online);
  const offlineFriends = friends.filter(f => !f.online);
  const maxVisibleFriends = 4;

  const renderFullListTooltip = (list: typeof friends, label: string) => (
    <Tooltip.Portal>
      <Tooltip.Content
        className="tooltip-content friends-tooltip-content"
        side="right"
        align="start"
      >
        <strong>{label}</strong>
        <div className="friends-tooltip-list">
          {list.map(friend => (
            <div key={friend.id} className="friends-tooltip-item">
              <AvatarUtil id={friend.id} radius={34} showStatus={friend.online} />
              <div className="friends-tooltip-meta">
                <span className="friends-tooltip-name">{friend.name}</span>
                <span className={`friends-tooltip-presence ${friend.online ? 'online' : 'offline'}`}>
                  {friend.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Tooltip.Arrow className="tooltip-arrow" />
      </Tooltip.Content>
    </Tooltip.Portal>
  );

  const renderFriendAvatars = (list: typeof friends, label: string) => {
    if (list.length === 0) {
      return <span className="friends-empty">No friends</span>;
    }

    const visibleFriends = list.slice(0, maxVisibleFriends);
    const hiddenFriends = list.slice(maxVisibleFriends);

    return (
      <Tooltip.Provider delayDuration={150}>
        <div className="friends-avatar-list">
          {visibleFriends.map(friend => (
            <Tooltip.Root key={friend.id}>
              <Tooltip.Trigger asChild>
                <button type="button" className="friend-avatar-button" aria-label={friend.name}>
                  <AvatarUtil id={friend.id} radius={42} showStatus={friend.online} />
                </button>
              </Tooltip.Trigger>
              {renderFullListTooltip([friend], friend.name)}
            </Tooltip.Root>
          ))}

          {hiddenFriends.length > 0 && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className="friend-avatar-button friend-avatar-button--overflow"
                  aria-label={`Show all ${label.toLowerCase()}`}
                >
                  ...
                </button>
              </Tooltip.Trigger>
              {renderFullListTooltip(list, label)}
            </Tooltip.Root>
          )}
        </div>
      </Tooltip.Provider>
    );
  };

  return (
    <div className="dashboard-card">
      <h3>Friends</h3>
      {isLoading && total === 0 ? (
        <div className="friends-total">Loading...</div>
      ) : (
        <>
      <div className="friends-total">
        Total: {total}
      </div>
      <div className="friends-status">
        <div className="status-group">
          <div className="friends-group-header">
            <span className="status-dot online"></span>
            <span className="status-text">Online: {onlineFriends.length}</span>
          </div>
          {renderFriendAvatars(onlineFriends, 'Online Friends')}
        </div>
        <div className="status-group">
          <div className="friends-group-header">
            <span className="status-dot offline"></span>
            <span className="status-text">Offline: {offlineFriends.length}</span>
          </div>
          {renderFriendAvatars(offlineFriends, 'Offline Friends')}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
