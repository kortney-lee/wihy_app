import React, { useState } from 'react';
import { X, Send, Calendar, Clock, CheckCircle, AlertCircle, User, Star } from 'lucide-react';

interface CoachInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvitation?: (invitation: CoachInvitation) => void;
  onAcceptInvitation?: (invitationId: string) => void;
  onDeclineInvitation?: (invitationId: string) => void;
  mode: 'send' | 'receive' | 'manage';
  coach?: {
    id: string;
    name: string;
    title: string;
    rating?: number;
    specialties: string[];
    pricing?: {
      consultation: number;
      monthlyPlan: number;
    };
  };
  invitation?: PendingInvitation;
  existingInvitations?: PendingInvitation[];
}

interface CoachInvitation {
  coachId: string;
  message: string;
  consultationRequested: boolean;
  preferredStartDate: string;
}

interface PendingInvitation {
  id: string;
  coachName: string;
  coachTitle: string;
  message: string;
  sentDate: string;
  status: 'pending' | 'accepted' | 'declined';
  type: 'sent' | 'received';
}

export const CoachInvitationModal: React.FC<CoachInvitationModalProps> = ({
  isOpen,
  onClose,
  onSendInvitation,
  onAcceptInvitation,
  onDeclineInvitation,
  mode,
  coach,
  invitation,
  existingInvitations = []
}) => {
  const [message, setMessage] = useState('');
  const [consultationRequested, setConsultationRequested] = useState(true);
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendInvitation = async () => {
    if (!coach || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const invitation: CoachInvitation = {
        coachId: coach.id,
        message: message.trim(),
        consultationRequested,
        preferredStartDate
      };
      
      await onSendInvitation?.(invitation);
      setMessage('');
      setConsultationRequested(true);
      setPreferredStartDate('');
      onClose();
    } catch (error) {
      console.error('Failed to send invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;
    setIsSubmitting(true);
    try {
      await onAcceptInvitation?.(invitation.id);
      onClose();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    setIsSubmitting(true);
    try {
      await onDeclineInvitation?.(invitation.id);
      onClose();
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSendMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
          {coach?.name.charAt(0)}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{coach?.name}</h3>
        <p className="text-gray-600">{coach?.title}</p>
        {coach?.rating && (
          <div className="flex items-center justify-center space-x-1 mt-2">
            <Star size={16} className="text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{coach.rating}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Specialties</h4>
        <div className="flex flex-wrap gap-2">
          {coach?.specialties.map((specialty) => (
            <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {coach?.pricing && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Consultation</p>
            <p className="font-semibold text-gray-800">${coach.pricing.consultation}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Monthly Plan</p>
            <p className="font-semibold text-gray-800">${coach.pricing.monthlyPlan}/mo</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Introduce yourself and your goals
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Tell your coach about your fitness goals, experience level, and what you're hoping to achieve..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={consultationRequested}
            onChange={(e) => setConsultationRequested(e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="ml-2 text-sm text-gray-700">Request initial consultation</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred start date (optional)
          </label>
          <input
            type="date"
            value={preferredStartDate}
            onChange={(e) => setPreferredStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Next steps:</strong> Your invitation will be sent to {coach?.name}. 
          They'll review your message and respond within their typical response time. 
          You'll receive a notification when they accept or have questions.
        </p>
      </div>
    </div>
  );

  const renderReceiveMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
          {invitation?.coachName.charAt(0)}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Invitation from {invitation?.coachName}</h3>
        <p className="text-gray-600">{invitation?.coachTitle}</p>
        <p className="text-sm text-gray-500 mt-2">Received {invitation?.sentDate}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Message from your coach:</h4>
        <p className="text-gray-700">{invitation?.message}</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>What happens next:</strong> If you accept this invitation, {invitation?.coachName} will 
          become your dedicated coach. They'll help create personalized meal and workout plans, 
          provide ongoing support, and track your progress.
        </p>
      </div>
    </div>
  );

  const renderManageMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800">Coach Invitations</h3>
        <p className="text-gray-600">Manage your sent and received invitations</p>
      </div>

      {existingInvitations.length === 0 ? (
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No invitations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {existingInvitations.map((inv) => (
            <div key={inv.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {inv.coachName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{inv.coachName}</h4>
                    <p className="text-sm text-gray-600">{inv.coachTitle}</p>
                    <p className="text-xs text-gray-500">{inv.type} on {inv.sentDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    inv.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                  
                  {inv.status === 'pending' && inv.type === 'received' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={handleAccept}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleDecline}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mt-3 line-clamp-2">{inv.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === 'send' && 'Request Coach'}
            {mode === 'receive' && 'Coach Invitation'}
            {mode === 'manage' && 'Manage Invitations'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'send' && renderSendMode()}
          {mode === 'receive' && renderReceiveMode()}
          {mode === 'manage' && renderManageMode()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {mode === 'send' && (
              <button
                onClick={handleSendInvitation}
                disabled={isSubmitting || !message.trim()}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            )}
            
            {mode === 'receive' && (
              <>
                <button
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle size={16} />
                  <span>Accept</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};