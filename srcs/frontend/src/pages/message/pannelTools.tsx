import type { User, Message } from "."
import "./message.css"

interface headerProps {
  participants: User
  onBlockUser: (userId: number) => void
  // onViewProfile: (userId: number) => void
 }

export function headerMessage({ participants, onBlockUser }: headerProps) {
  return (
    <div className="msg-chat-header
                    d-flex
                    align-items-center
                    justify-content-between
                    px-3
                    py-2">
    
      <div className="d-flex align-items-center gap-2">
        <div style={{ position: "relative" }}>
          <div className="msg-avatar"
              style={{ background: "#64B5F6" }}>
            {participants.name.slice(0, 2).toUpperCase()}
          </div>
          <span className={`status-dot ${participants?.isOnline ? "online-dot" : "offline-dot"}`} />
        </div>
        <p style={{ margin: 0, fontWeight: 600 }}>{participants.name}</p>
      </div>

      <button className="icon-action" onClick={() => onBlockUser(participants.id)}>
        🚫
      </button>
  </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn}: MessageBubbleProps) {
  const customStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: "10px",
    opacity: 0.6,
    right: (!isOwn ? 'auto': '55px')
  };

  return (
    <div >
      <div className={`d-flex ${isOwn ? "justify-content-end" : "justify-content-start"}`}>
      <div className={`bubble ${isOwn ? "bubble-me" : "bubble-them"}`}>
         <span>{message.text}</span>
        </div>
      </div>
         <div style={customStyle}>
          <small >{message.time}</small>
         </div>
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
    <div className="msg-input-area">
      <textarea
        className="msg-textarea"
        rows={1}
        placeholder="Type a message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        />
      <button
        className="send-btn-custom"
        onClick={onSend}
        disabled={!value.trim()}
        >
        ➤
      </button>
      </div>
  )
}
