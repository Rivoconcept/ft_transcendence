import Sidebar from "./sidebar";
import ChatPanel from "./chatPannel";
import { useMessaging } from "./messagingTools";

export default function MessagesPage() {
    const { selected, selectConversation } = useMessaging()
    return (
      <div className="messages-root">
        <Sidebar onSelectConversation={selectConversation} />
        <ChatPanel conversation={selected} />
      </div>
    )
  }
