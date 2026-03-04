export interface User {
    id: number;
    name: string;
    avatar: string;
    isOnline: boolean;
    blockedUsers?: number[];
}

export type Message = TextMessage | GameInviteMessage

export interface BaseMessage {
    id: number;
    time: string;
    senderId: number;
    read?: boolean;
}

export interface TextMessage extends BaseMessage {
    type: "text"
    text: string
}

export interface GameInviteMessage extends BaseMessage {
    text: string
    type: "game_invite"
    roomId : number
    gameName: string
    status: "pending" | "accepted" | "declined"
}

// export interface TextMessage extends BaseMessage {
    
// }
// export type NewMessage = Omit<Message, id | "time">

export interface Conversation {
	id: number;
	lastMessage: string;
	time: string;
	unread: number;
	// online: boolean;
    // blocked: boolean;
	messages: Message[];
	participants: User[];
}
