// Real-Time Collaboration Types

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  permissions: TeamPermissions;
}

export interface TeamPermissions {
  canCreateProfiles: boolean;
  canDeleteProfiles: boolean;
  canEditProfiles: boolean;
  canLaunchProfiles: boolean;
  canManageProxies: boolean;
  canManageExtensions: boolean;
  canViewAnalytics: boolean;
  canManageTeam: boolean;
  canAccessSettings: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  members: TeamMember[];
  createdAt: Date;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxMembers: number;
  maxProfiles: number;
}

export interface ProfileShare {
  id: string;
  profileId: string;
  sharedBy: string;
  sharedWith: string[];
  permissions: 'view' | 'launch' | 'edit' | 'full';
  expiresAt?: Date;
  createdAt: Date;
}

export interface CollaborationSession {
  id: string;
  profileId: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
  actions: CollaborationAction[];
}

export interface CollaborationAction {
  id: string;
  sessionId: string;
  userId: string;
  action: 'launch' | 'stop' | 'edit' | 'proxy_change' | 'extension_toggle';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: string;
  target: string;
  description: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: string[];
}
