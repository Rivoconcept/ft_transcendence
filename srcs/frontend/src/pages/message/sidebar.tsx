import { useMessaging } from "./messagingTools"
// import type { Conversation } from "."

interface SidebarProps {
  onSelectConversation: (id: number) => void
}

export default function Sidebar({ onSelectConversation }: SidebarProps) {
  const { conversations, selected, search, setSearch, getOtherParticipant } = useMessaging()

  const filtered = conversations.filter(conv =>
    getOtherParticipant(conv)?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="msg-sidebar">

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Liste des conversations */}
      <div>
        {filtered.map(conv => {
          const other = getOtherParticipant(conv)
          return (
            <div
              key={conv.id}
              className={conv.id === selected?.id ? "convo-item active" : "convo-item"}
              onClick={() => onSelectConversation(conv.id)}
            >
              <p>{other?.name}</p>
              <small>{conv.lastMessage}</small>
              {conv.unread > 0 && (
                <span>{conv.unread}</span>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}