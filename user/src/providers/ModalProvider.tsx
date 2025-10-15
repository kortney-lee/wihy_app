import React, { useState, ReactNode } from 'react';
import { ModalContext, ModalContextType } from '../services/modalService';

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const contextValue: ModalContextType = {
    showNotifications,
    showAccount,
    openNotifications: () => setShowNotifications(true),
    closeNotifications: () => setShowNotifications(false),
    openAccount: () => setShowAccount(true),
    closeAccount: () => setShowAccount(false),
    closeAllModals: () => {
      setShowNotifications(false);
      setShowAccount(false);
    }
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};