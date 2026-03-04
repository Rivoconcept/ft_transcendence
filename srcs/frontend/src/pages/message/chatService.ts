import { conversations, currentUser, type Conversation, type Message, type User } from "."

export const chatService = {

    getConversations: (): Conversation[] => {
        return (conversations);
    },

    getConversationById: (id: number): (Conversation | undefined) => {
        return (conversations.find(c => c.id === id));
    },

    sendMessage: (
        _conversationId: number,
        message: Message,
    ): Message  => {
        return {...message,
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
    },
    
    blockUser: (userId: number): User => {
        return {
          ...currentUser,
          blockedUsers: [...currentUser.blockedUsers ?? [], userId]
        }
      },

    //   sendGameInvite: (conversationId: number): Message => {
        // que doit contenir ce message ?
        // quel type aura-t-il ?
    //   },
}
