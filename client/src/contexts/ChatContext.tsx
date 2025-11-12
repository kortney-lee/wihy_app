import React, { createContext, useContext, useRef, useState } from 'react';
import { FullScreenChatRef } from '../components/ui/FullScreenChat';

interface ChatContextType {
  chatRef: React.RefObject<FullScreenChatRef>;
  isChatOpen: boolean;
  openChat: (userQuery: string, context: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const chatRef = useRef<FullScreenChatRef>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = (userQuery: string, context: string) => {
    if (chatRef.current) {
      chatRef.current.addMessage(userQuery, context);
    }
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <ChatContext.Provider value={{
      chatRef,
      isChatOpen,
      openChat,
      closeChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};