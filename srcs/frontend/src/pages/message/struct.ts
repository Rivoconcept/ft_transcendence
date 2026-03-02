export interface User {
    id: number;
    name: string;
    avatar: string;
    isOnline: boolean;
    isBlocked: boolean;
}

export type MessageType = "text" | "game_invite" | "tournament_notification"

export interface Message {
    id: number;
    text: string;
    time: string;
    senderId: number;
    read?: boolean;
    type: MessageType;
}

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
