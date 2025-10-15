import { createContext, useContext, ReactNode } from 'react';

export interface ModalContextType {
  showNotifications: boolean;
  showAccount: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  openAccount: () => void;
  closeAccount: () => void;
  closeAllModals: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};