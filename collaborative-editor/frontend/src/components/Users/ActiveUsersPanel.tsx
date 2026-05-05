import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Crown, 
  Shield, 
  Eye, 
  Edit,
  MoreVertical,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ActiveUser, WorkspaceMember } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ActiveUsersPanelProps {
  activeUsers: ActiveUser[];
  workspaceMembers?: WorkspaceMember[];
  onInviteUser?: () => void;
}

const ActiveUsersPanel: React.FC<ActiveUsersPanelProps> = ({ 
  activeUsers, 
  workspaceMembers,
  onInviteUser 
}) => {
  const { user: currentUser } = useAuth();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-yellow-400" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-blue-400" />;
      case 'editor':
        return <Edit className="w-3 h-3 text-green-400" />;
      case 'viewer':
        return <Eye className="w-3 h-3 text-gray-400" />;
      default:
        return <User className="w-3 h-3 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-400';
      case 'admin':
        return 'text-blue-400';
      case 'editor':
        return 'text-green-400';
      case 'viewer':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getOnlineStatus = (user: ActiveUser) => {
    // Check if user is actively editing or just viewing
    const isActive = user.cursor || user.selection;
    return isActive ? 'online' : 'idle';
  };

  const userVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Active Users</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">{activeUsers.length}</span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onInviteUser}
          className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium neon-glow"
        >
          Invite User
        </motion.button>
      </div>

      {/* Active Users List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <AnimatePresence>
            {activeUsers.map((user, index) => {
              const isCurrentUser = user.id === currentUser?.id;
              const onlineStatus = getOnlineStatus(user);
              
              return (
                <motion.div
                  key={user.id}
                  variants={userVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl transition-all ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-2 border-blue-400/30'
                      : 'glass-dark hover:bg-white/5 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* User Avatar */}
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Online Status Indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        onlineStatus === 'online' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}>
                        {onlineStatus === 'online' ? (
                          <Wifi className="w-2 h-2 text-white" />
                        ) : (
                          <WifiOff className="w-2 h-2 text-white" />
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium truncate">
                          {user.username}
                          {isCurrentUser && <span className="text-xs text-blue-400">(You)</span>}
                        </h4>
                      </div>
                      
                      {/* User Activity */}
                      <div className="flex items-center space-x-2 mt-1">
                        {user.cursor && (
                          <div className="flex items-center space-x-1 text-xs text-white/60">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span>Editing line {user.cursor.line + 1}</span>
                          </div>
                        )}
                        {user.selection && (
                          <div className="flex items-center space-x-1 text-xs text-white/60">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <span>Selected {user.selection.end.line - user.selection.start.line + 1} lines</span>
                          </div>
                        )}
                        {!user.cursor && !user.selection && (
                          <div className="flex items-center space-x-1 text-xs text-white/60">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                            <span>Viewing</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Badge */}
                    {workspaceMembers && (
                      <div className="flex flex-col items-end space-y-1">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(workspaceMembers.find(m => m.user.id === user.id)?.role || 'viewer')}`}>
                          {getRoleIcon(workspaceMembers.find(m => m.user.id === user.id)?.role || 'viewer')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cursor Position Preview */}
                  {user.cursor && !isCurrentUser && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 pt-2 border-t border-white/10"
                    >
                      <div className="text-xs text-white/60">
                        <span>Cursor: Line {user.cursor.line + 1}, Column {user.cursor.column + 1}</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activeUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <User className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-white font-medium mb-2">No active users</h3>
              <p className="text-white/60 text-sm">Invite team members to collaborate</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Workspace Members Section */}
      {workspaceMembers && workspaceMembers.length > 0 && (
        <div className="border-t border-white/10 p-4">
          <h4 className="text-white/80 font-medium text-sm mb-3">All Members ({workspaceMembers.length})</h4>
          <div className="space-y-2">
            {workspaceMembers.map((member, index) => {
              const isActive = activeUsers.some(user => user.id === member.user.id);
              
              return (
                <motion.div
                  key={member.user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: member.user.color }}
                    >
                      {member.user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white/80 text-sm">{member.user.username}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isActive && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    <div className={`flex items-center space-x-1 ${getRoleColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsersPanel;
