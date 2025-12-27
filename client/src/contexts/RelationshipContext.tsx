import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// RELATIONSHIP CONTEXT - Coach/Client Relationships
// ============================================================

export interface Organization {
  id: string;
  name: string;
  type: 'gym' | 'studio' | 'clinic' | 'enterprise';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  coachId?: string;
  orgId: string;
  joinedAt: Date;
  lastActivity?: Date;
  tags: string[];
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  orgId: string;
  specializations: string[];
  clientIds: string[];
}

export type UserRole = 'client' | 'coach' | 'admin';

interface RelationshipContextType {
  // Current user state
  activeOrgId: string | null;
  myRole: UserRole;
  currentUserId: string | null;
  
  // Coach state
  coachClients: Client[];
  selectedClientId: string | null;
  myCoach: Coach | null;
  
  // Organizations
  organizations: Organization[];
  
  // Actions
  setActiveOrg: (orgId: string) => void;
  setSelectedClient: (clientId: string | null) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClientStatus: (clientId: string, status: Client['status']) => void;
  inviteClient: (email: string, name?: string) => Promise<void>;
}

const RelationshipContext = createContext<RelationshipContextType | undefined>(undefined);

// Mock data for development
const mockOrganizations: Organization[] = [
  { id: 'org1', name: 'FitLife Gym', type: 'gym' },
  { id: 'org2', name: 'Wellness Studio', type: 'studio' },
  { id: 'org3', name: 'Corporate Health', type: 'enterprise' }
];

const mockClients: Client[] = [
  {
    id: 'client1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    status: 'active',
    orgId: 'org1',
    coachId: 'coach1',
    joinedAt: new Date('2024-01-15'),
    lastActivity: new Date('2024-12-24'),
    tags: ['weight-loss', 'beginner']
  },
  {
    id: 'client2', 
    name: 'Mike Chen',
    email: 'mike@example.com',
    status: 'active',
    orgId: 'org1',
    coachId: 'coach1',
    joinedAt: new Date('2024-03-10'),
    lastActivity: new Date('2024-12-25'),
    tags: ['strength', 'intermediate']
  },
  {
    id: 'client3',
    name: 'Emma Davis',
    email: 'emma@example.com', 
    status: 'pending',
    orgId: 'org1',
    coachId: 'coach1',
    joinedAt: new Date('2024-12-20'),
    tags: ['nutrition', 'beginner']
  }
];

const mockCoach: Coach = {
  id: 'coach1',
  name: 'Alex Rodriguez',
  email: 'alex@fitlife.com',
  orgId: 'org1',
  specializations: ['Strength Training', 'Nutrition', 'Weight Loss'],
  clientIds: ['client1', 'client2', 'client3']
};

export const RelationshipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeOrgId, setActiveOrgId] = useState<string | null>('org1');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [coachClients, setCoachClients] = useState<Client[]>(mockClients);
  const [organizations] = useState<Organization[]>(mockOrganizations);
  
  // For demo purposes, hardcode role as coach
  // In real app, this would come from auth context
  const myRole: UserRole = 'coach' as UserRole; // Change this to 'client' to test client view
  const currentUserId = 'coach1';
  const myCoach = myRole === 'client' ? mockCoach : null;

  const setActiveOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    setSelectedClientId(null); // Reset client selection when switching orgs
  };

  const setSelectedClient = (clientId: string | null) => {
    setSelectedClientId(clientId);
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `client_${Date.now()}`,
      joinedAt: new Date(),
      tags: clientData.tags || []
    };
    setCoachClients(prev => [...prev, newClient]);
  };

  const updateClientStatus = (clientId: string, status: Client['status']) => {
    setCoachClients(prev => 
      prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      )
    );
  };

  const inviteClient = async (email: string, name?: string) => {
    // Mock invitation - in real app would call API
    const newClient: Client = {
      id: `client_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      status: 'pending',
      orgId: activeOrgId!,
      coachId: currentUserId,
      joinedAt: new Date(),
      tags: []
    };
    
    setCoachClients(prev => [...prev, newClient]);
    
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <RelationshipContext.Provider value={{
      activeOrgId,
      myRole,
      currentUserId,
      coachClients,
      selectedClientId,
      myCoach,
      organizations,
      setActiveOrg,
      setSelectedClient,
      addClient,
      updateClientStatus,
      inviteClient
    }}>
      {children}
    </RelationshipContext.Provider>
  );
};

export const useRelationships = () => {
  const context = useContext(RelationshipContext);
  if (context === undefined) {
    throw new Error('useRelationships must be used within a RelationshipProvider');
  }
  return context;
};