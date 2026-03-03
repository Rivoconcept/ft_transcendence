import type {User , Conversation} from "."

export const currentUser: User = {
    id: 1, 
    name: "Moi",
    avatar: "SC",
    isOnline: true,
    isBlocked: false
};

export const mockUsers: User[] = [
    { id: 2, name: "Alice", avatar: "AR", isOnline: true, isBlocked: false },
    { id: 3, name: "Jackson", avatar: "DT", isOnline: false, isBlocked: false },
    { id: 4, name: "Bob", avatar: "JP", isOnline: true, isBlocked: true },
    { id: 5, name: "Charlie", avatar: "PS", isOnline: false, isBlocked: true },
  ]

export const conversations: Conversation[] = [
    {
        id: 1,
        lastMessage: "how are u?", 
        time: "9:33 AM",           
        unread: 1,               
        participants: [currentUser, mockUsers[0]], 
        messages: [
            { id: 1,
                text: "Hello",
                time: "9:30 AM",
                senderId: 2,
                read: true,
                type: "text",
            },
            { id: 2,
                text: "Hey",
                time: "9:32 AM",
                senderId: 1,
                read: true,
                type: "text",
            },
            { id: 3,
                text: "how are u?",
                time: "9:33 AM",
                senderId: 2,
                read: false,
                type: "text",
            },
        ],
    },
    {
        id: 2,
        lastMessage: "Hey", 
        time: "10:35 AM",           
        unread: 1,               
        participants: [currentUser, mockUsers[1]], 
        messages: [
            { id: 1,
                text: "Hey",
                time: "10:35 AM",
                senderId: 3,
                read: false,
                type: "text",
            },
        ],
    },
]; 
// online: true,            
// blocked: false,

export const avatarColors: Record<string, string> = {
	SC: "#E57373",
	AR: "#64B5F6",
	DT: "#81C784",
	JP: "#FFB74D",
	PS: "#BA68C8",
};