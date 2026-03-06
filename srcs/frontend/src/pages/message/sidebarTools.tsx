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
                           isBlocked, onClick} : ConvItemProps)

                           {
                            
                           }
