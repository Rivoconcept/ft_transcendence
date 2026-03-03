import { conversations, type Conversation, type Message } from "."

export const chatService = {

    getConversations: (): Conversation[] => {
        return (conversations);
    }

    getConversationById: (id: number): (Conversation | undefined) => {
        return (conversations.find(c => c.id === id));
    }

    sendMessage: (
        conversationId: number,
        message: Message,
    ): Message  => {
        return {...message,
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
    
    }
    

}
