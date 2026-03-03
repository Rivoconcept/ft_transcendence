import { conversations, type Conversation } from "."

export const chatService = {

    getConversations: (): Conversation[] => {
        return (conversations);
    }

    getConversationById: (id: number): (Conversation | undefined) => {
        return (conversations.find(c => c.id === id));
    }

    sendMessage: (): Message => {
        
    }

}
