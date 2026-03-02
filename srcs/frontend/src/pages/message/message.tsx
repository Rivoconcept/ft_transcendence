// import { useState, useRef, useEffect } from "react";
// import {
// 	Search,
// 	Send,
// 	MoreVertical,
// 	Phone,
// 	Video,
// 	ArrowLeft,
// 	Check,
// 	CheckCheck,
// 	Paperclip,
// 	Smile,
// } from "lucide-react";

export interface Message {
    id: number;
    text: string;
    time: string;
    senderId: number;
    read: boolean;
    // type: MessageType;
}

export interface Conversation {
	id: number;
	name: string;
	avatar: string;
	lastMessage: string;
	time: string;
	unread: number;
	isOnline: boolean;
    isBlocked: boolean;
	messages: Message[];
}

