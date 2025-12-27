import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Mail, Phone, Calendar, Target, MoreHorizontal, MessageSquare, FileText } from 'lucide-react';
import { useRelationships } from '../contexts/RelationshipContext';
import { useMealPlans } from '../contexts/MealPlanContext';
import { useFitness } from '../contexts/FitnessContext';
import Header from '../components/shared/Header';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';

interface ClientManagementPageProps {
  onCreateMealPlan?: (clientId: string) => void;
  onCreateWorkoutPlan?: (clientId: string) => void;
}

const ClientManagementPage: React.FC<ClientManagementPageProps> = ({
  onCreateMealPlan,
  onCreateWorkoutPlan
}) => {
  const { coachClients, updateClientStatus } = useRelationships();
  const { createClientMealPlan } = useMealPlans();
  const { } = useFitness();
  
  // Mock functions for missing context properties
  const addNewClient = (client: any) => console.log('Add client:', client);
  const removeClient = (clientId: string) => console.log('Remove client:', clientId);
  const getClientMealPlans = (clientId: string) => [];
  const getClientWorkouts = (clientId: string) => [];
  const createClientWorkout = (clientId: string, workout: any) => console.log('Create workout:', clientId, workout);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [newClientForm, setNewClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    notes: ''
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Window width detection for responsive padding
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter clients based on search and status
  const filteredClients = coachClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddClient = () => {
    if (newClientForm.name && newClientForm.email) {
      const newClient = {
        id: `client-${Date.now()}`,
        name: newClientForm.name,
        email: newClientForm.email,
        goal: newClientForm.goal,
        status: 'pending' as const,
        phone: newClientForm.phone,
        notes: newClientForm.notes,
        joinDate: new Date().toISOString().split('T')[0]
      };
      
      addNewClient(newClient);
      setNewClientForm({ name: '', email: '', phone: '', goal: '', notes: '' });
      setShowAddModal(false);
    }
  };

  const handleCreateMealPlan = (clientId: string) => {
    const client = coachClients.find(c => c.id === clientId);
    if (client) {
      const mealPlan = {
        id: `meal-plan-${Date.now()}`,
        name: `${client.name}'s Meal Plan`,
        planType: 'This Week' as const,
        goals: [],
        meals: [],
        prepBatches: []
      };
      createClientMealPlan(clientId, mealPlan);
      onCreateMealPlan?.(clientId);
    }
  };

  const handleCreateWorkoutPlan = (clientId: string) => {
    const client = coachClients.find(c => c.id === clientId);
    if (client) {
      const workout = {
        name: `${client.name}'s Workout`,
        description: 'Custom workout plan',
        exercises: [],
        duration: 30,
        difficulty: 'beginner' as const,
        date: new Date(),
        status: 'active' as const,
        phases: []
      };
      createClientWorkout(clientId, workout);
      onCreateWorkoutPlan?.(clientId);
    }
  };

  const renderClientCard = (client: any) => (
    <div key={client.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
            {client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{client.name}</h3>
            <p className="text-sm text-gray-600">{client.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            client.status === 'active' ? 'bg-green-100 text-green-700' :
            client.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {client.status}
          </span>
          
          <button
            onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreHorizontal size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {client.goal && (
        <div className="flex items-center space-x-2 mb-4">
          <Target size={14} className="text-orange-500" />
          <span className="text-sm text-gray-600">{client.goal}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <Calendar size={12} />
          <span>Joined {client.joinDate || 'Recently'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <FileText size={12} />
          <span>2 plans active</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => handleCreateMealPlan(client.id)}
          className="flex-1 px-3 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
        >
          Meal Plan
        </button>
        <button
          onClick={() => handleCreateWorkoutPlan(client.id)}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
        >
          Workout
        </button>
        <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
          <MessageSquare size={14} />
        </button>
      </div>

      {/* Quick Actions Dropdown */}
      {selectedClient === client.id && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="space-y-2">
            <button className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-white rounded transition-colors">
              View Progress
            </button>
            <button className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-white rounded transition-colors">
              Send Message
            </button>
            <button className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-white rounded transition-colors">
              Edit Details
            </button>
            <button 
              onClick={() => updateClientStatus(client.id, 'inactive')}
              className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-white rounded transition-colors"
            >
              Deactivate
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderClientRow = (client: any) => (
    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-800">{client.name}</div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          client.status === 'active' ? 'bg-green-100 text-green-700' :
          client.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {client.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {client.goal || 'No goal set'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {client.joinDate || 'Recently'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-1">
          <button
            onClick={() => handleCreateMealPlan(client.id)}
            className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
          >
            Meal
          </button>
          <button
            onClick={() => handleCreateWorkoutPlan(client.id)}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Workout
          </button>
          <button className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors">
            More
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {/* Fixed Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white ${PlatformDetectionService.isNative() ? 'pt-12' : ''}`}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={() => {}}
          onChatMessage={() => {}}
          isInChatMode={false}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      </div>

      {/* Main Container */}
      <div 
        className="min-h-screen bg-[#f0f7ff] overflow-hidden"
        style={{ paddingTop: windowWidth < 768 ? '320px' : windowWidth < 1200 ? '300px' : '180px' }}
      >
        <div 
          className="w-full min-h-screen bg-[#f0f7ff]"
          style={{
            padding: windowWidth < 768 ? '5px 8px 0 8px' : '10px 20px',
            paddingTop: 0,
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
            <p className="text-gray-600">Manage and track your client relationships</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <UserPlus size={16} />
            <span>Add Client</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{coachClients.length}</div>
          <div className="text-sm text-gray-600">Total Clients</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{coachClients.filter(c => c.status === 'active').length}</div>
          <div className="text-sm text-gray-600">Active Clients</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{coachClients.filter(c => c.status === 'pending').length}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">8</div>
          <div className="text-sm text-gray-600">Plans Created</div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first client'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add Your First Client
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(renderClientCard)}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map(renderClientRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Client</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter client name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newClientForm.phone}
                    onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                  <select
                    value={newClientForm.goal}
                    onChange={(e) => setNewClientForm({ ...newClientForm, goal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select a goal</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="General Health">General Health</option>
                    <option value="Athletic Performance">Athletic Performance</option>
                    <option value="Rehabilitation">Rehabilitation</option>
                    <option value="Nutrition Education">Nutrition Education</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newClientForm.notes}
                  onChange={(e) => setNewClientForm({ ...newClientForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Additional notes about the client..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClientForm.name || !newClientForm.email}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
        )}
        </div>
        </div>
      </div>
    </>
  );
};

export default ClientManagementPage;