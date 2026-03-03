// import type {Conversation} from "./struct"
import { conversations } from "./mockdata";
import { useState } from "react";
import {Send} from "lucide-react"

export default function MessagesPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeChat = conversations.find(c => c.id === activeId);
}
