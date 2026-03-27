import { useChat } from "../../hooks" 
import type { ChatListItem, MessageItem } from "../../models";

interface ChatPanelProps {
    // Données
    chat: ChatListItem | null
    messages: MessageItem[]
    currentUserId?: number
    blockedUserIds?: Set<number>
    isChatBlocked?: boolean
    isLoading?: boolean
  
    // Input
    input: string
    onInputChange: (value: string) => void
    onSend: () => void
  
    // Image
    imagePreview?: string | null
    imageError?: string | null
    onImageSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCancelImage?: () => void
    onImageErrorDismiss?: () => void
    fileInputRef?: React.RefObject<HTMLInputElement>
  
    // Scroll refs
    scrollContainerRef?: React.RefObject<HTMLDivElement>
    bottomRef?: React.RefObject<HTMLDivElement>
    topSentinelRef?: React.RefObject<HTMLDivElement>
  
    // Actions
    onBack?: () => void
    onBlockUser?: (userId: number) => void
    onUnblockUser?: (userId: number) => void
    formatTime?: (dateStr: string) => string
  }

export default function ChatPanel({
    chat,
    messages,
    currentUserId,
    blockedUserIds,
    isChatBlocked,
    isLoading,
    input,
    onInputChange,
    onSend,
    imagePreview,
    imageError,
    onImageSelect,
    onCancelImage,
    onImageErrorDismiss,
    fileInputRef,
    scrollContainerRef,
    bottomRef,
    topSentinelRef,
    onBack,
    onBlockUser,
    onUnblockUser,
    formatTime,
  }: ChatPanelProps) {
  
    const { getChatDisplayName, getOtherUserId, showDropdown, setShowDropdown } = useChat()
  
    if (!chat) return (
      <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
        <div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
        <h5 className="mt-3 fw-semibold" style={{ color: "var(--text-secondary)" }}>
          Send the first message
        </h5>
      </div>
    )
  
    return (
        <main className="msg-chat-panel">
        {select<div className="msg-chat-header d-flex align-items-center gap-2 px-3 py-2">
                    <button className="icon-action back-btn" onClick={() => { setMobileView("list"); navigate("/messages"); }}>
                edChat ? (
            <>
                        <ArrowLeft size={18} className="icon-themed" />
                    </button>

                    <div className="flex-shrink-0">
                        <ChatAvatar chat={selectedChat} size={40} currentUserId={currentUser?.id} />
                    </div>

                    <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ fontSize: 15, color: "var(--text-primary)" }}>
                            {getChatDisplayName(selectedChat)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {selectedChat.type === "group"
                                ? `${selectedChat.memberIds.length} members`
                                : ""}
                        </div>
                    </div>

                    <div className="d-flex gap-1 position-relative">
                        <button className="icon-action" onClick={(e) => { e.stopPropagation(); setShowDropdown(prev => !prev); }}>
                            <MoreVertical size={17} className="icon-themed" />
                        </button>
                        {showDropdown && selectedChat.type === "direct" && (() => {
                            const otherUserId = getOtherUserId(selectedChat);
                            const isOtherBlocked = blockedUserIds.has(otherUserId);
                            return (
                                <div className="chat-dropdown-menu">
                                    {isOtherBlocked ? (
                                        <button className="chat-dropdown-item" onClick={() => handleUnblockUser(otherUserId)}>
                                            <ShieldCheck size={15} /> Unblock
                                        </button>
                                    ) : (
                                        <button className="chat-dropdown-item danger" onClick={() => handleBlockUser(otherUserId)}>
                                            <ShieldBan size={15} /> Block
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="msg-area" ref={scrollContainerRef} key={selectedChatId}>
                    <div ref={topSentinelRef} style={{ height: 1 }} />

                    {isLoading && messages.length > 0 && (
                        <div className="text-center py-2">
                            <small style={{ color: "var(--text-secondary)" }}>Loading older messages...</small>
                        </div>
                    )}

                    {isLoading && messages.length === 0 && (
                        <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                            <small style={{ color: "var(--text-secondary)" }}>Loading messages...</small>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const fromMe = msg.authorId === currentUser?.id || msg.id < 0;
                        const isMessageBlocked = !fromMe && blockedUserIds.has(msg.authorId);
                        return (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                fromMe={fromMe}
                                formatTime={formatTime}
                                isBlocked={isMessageBlocked}
                            />
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {imagePreview && (
                    <div className="image-preview-bar">
                        <img src={imagePreview} alt="preview" className="image-preview-thumb" />
                        <span className="image-preview-label" style={{ color: "var(--text-secondary)", fontSize: 13 }}>Image ready to send</span>
                        <button className="icon-action" onClick={cancelImagePreview} title="Cancel">
                            <X size={16} className="icon-themed" />
                        </button>
                    </div>
                )}

                {imageError && (
                    <div className="image-error-bar">
                        <small>{imageError}</small>
                        <button className="icon-action" onClick={() => setImageError(null)}>
                            <X size={14} className="icon-themed" />
                        </button>
                    </div>
                )}

                {isChatBlocked ? (
                    <div className="msg-input-area" style={{ justifyContent: "center" }}>
                        <span style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: 14 }}>
                            You cannot send messages to this person
                        </span>
                    </div>
                ) : (
                <div className="msg-input-area">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        hidden
                        onChange={handleImageSelect}
                    />
                    <button className="icon-action" onClick={() => fileInputRef.current?.click()} title="Send image">
                        <Paperclip size={17} className="icon-themed" />
                    </button>

                    <textarea
                        className="msg-textarea"
                        rows={1}
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                        }}
                    />

                    <button className="icon-action">
                        <Smile size={17} className="icon-themed" />
                    </button>

                    <button
                        className="send-btn-custom"
                        onClick={handleSend}
                        disabled={!input.trim() && !imagePreview}
                    >
                        <Send size={20} />
                    </button>
                </div>
                )}
            </>
        ) : (
            <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
                <div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
                <h5 className="mt-3 fw-semibold" style={{ color: "var(--text-secondary)" }}>Select a conversation</h5>
                <p className="small" style={{ maxWidth: 280, color: "var(--text-secondary)" }}>
                    Choose from your existing messages on the left to continue a conversation.
                </p>
            </div>
        )}
    </main>
    )
  }
