import type { User, Message } from "./type"
import "./message.css"

interface headerProps {
  participants: User
  onBlockUser: (userId: number) => void
  // onViewProfile: (userId: number) => void
 }

export function headerMessage({ participants, onBlockUser }: headerProps) {
  return (
    <div className="msg-chat-header">
      <div>
        <p>{participants.name}</p>
        <span className={`status-dot ${participants?.isOnline ? "online-dot" : "offline-dot"}`} />
      </div>
      <button onClick={() => onBlockUser(participants.id)}>
        block
      </button>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn}: MessageBubbleProps) {
  return (
    <div>
      {/* <div className={isOwn ? "justify-end" : "justify-start"}> */}
        <div className={isOwn ? "bubble-me" : "bubble-them"}>
         <p>{message.text}</p>
          <small>{message.time}</small>
        </div>
      {/* </div> */}
    </div>
  )
}

interface MessageInputProps {
  value: string
  onChange: (text: string) => void
  onSend: () => void
}

export function MessageInput({ value, onChange, onSend }: MessageInputProps) {
  return (
    <div>
      <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      />
      <button onClick={onSend}>
        Envoyer
      </button>
    </div>
  )
}
