// import { Search } from "lucide-react"

import type { User } from "../../models"
import type { Conversation } from "./struct"

interface SearchBarProps {
    value: string
    onChange: (text: string) => void
}

export function SearchBar({ value, onChange } : SearchBarProps) {
    return (
        <div className="search-wrapper">
          <div className="input-group input-group-sm">
            <span className="input-group-text border-end-0 rounded-start-pill">
              🔍
            </span>
            <input
              type="text"
              className="form-control border-start-0 rounded-end-pill"
              placeholder="Search..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      )
}




export interface ConvItemProps {
    displayName: string
    conversation: Conversation
    other: User
    isActive: boolean
    isBlocked: boolean
    onClick: () => void
}

export function ConvItem({ displayName,
                           conversation,
                           other,
                           isActive,
                           isBlocked, onClick} : ConvItemProps) {
    return(
        <div
            className={`convo-iem d-flex align-item-center gap-2 px-3 py-2 ${isActive ? "active" : "inactive"}`}
            onClick={onClick}
        >
            <div style={{ position: "relative" }}>
                <div className="msg-avatar" style={{ background: "#64B5F6" }}>
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <span className={`status-dot ${other.isOnline ? "online-dot" : "offline-dot"}`} />
            </div>
            <div className="flex-grow-1 overflow-hidden">
                <div>
                    displayName
                </div>
                <div>conversation.lastMessage conversation. </div>
            </div>
        </div>
    )                            
}
