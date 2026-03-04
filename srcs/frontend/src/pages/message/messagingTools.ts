import { useState } from "react"
import { chatService } from "./chatService"
import { currentUser, type Conversation, type Message } from "."

export const useMessaging = () => {

  const [conversations, setConversations] = useState<Conversation[]>(
    chatService.getConversations()
  )
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")

  const selectConversation = (id: number) => {
    setSelected (chatService.getConversationById(id) ?? null)
  }

  const sendMessage = () => {
    if (!input.trim() || !selected) return

    const newInput: Message = {
        id: 0,
        text: input,
        time: "",
        senderId: currentUser.id,
        read: false,
        type: "text",
    }
    const newMessage = chatService.sendMessage(selected.id, newInput)

    const conversationsUpdate = conversations.map(conv => {
        if (conv.id === selected.id) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage]
          }
        }
        return (conv) 
      })
    
    setConversations(conversationsUpdate)
    setInput("")
  }

  return {
    conversations,
    selected,
    input,
    search,
    setInput,
    setSearch,
    selectConversation,
    sendMessage,
  }
}