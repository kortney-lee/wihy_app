import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SessionContextType {
  hasActiveSession: boolean;
  setHasActiveSession: (hasSession: boolean) => void;
  createMockSession: () => void;
  endSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const createMockSession = () => {
    setHasActiveSession(true);
    console.log('Mock session created - Dashboard access enabled');
  };

  const endSession = () => {
    setHasActiveSession(false);
    console.log('Session ended - Dashboard access disabled');
  };

  return (
    <SessionContext.Provider value={{
      hasActiveSession,
      setHasActiveSession,
      createMockSession,
      endSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
