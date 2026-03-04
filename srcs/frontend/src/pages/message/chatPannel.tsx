import { useMessaging } from "./messagingTools"
import MessageBubble, { MessageInput, headerMessage as HeaderMessage } from "./pannelTools"
import { currentUser } from "./mockdata"
import type { Conversation } from "./type"

interface ChatPanelProps {
  conversation: Conversation | null
}

export default function ChatPanel({ conversation }: ChatPanelProps) {
  const { input, setInput, sendMessage, getOtherParticipant } = useMessaging()

  if (!conversation) {
    return (
      <div>
        <p>Sélectionne une conversation</p>
      </div>
    )
  }

  const other = getOtherParticipant(conversation)

  if (!other) return null

  return (
    <div className="msg-chat-panel">

      {/* Header */}
      <HeaderMessage
        participants={other}
        onBlockUser={(id) => console.log("bloquer", id)}
        // onViewProfile={(id) => console.log("profil", id)}
        // onGameInvite={(id) => console.log("inviter", id)}
      />

      {/* Messages */}
      <div className="msg-area">
        {conversation.messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUser.id}
          />
        ))}
      </div>

      {/* Input */}
      <MessageInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
      />

    </div>
  )
}