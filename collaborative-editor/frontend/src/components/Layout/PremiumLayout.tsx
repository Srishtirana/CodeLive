import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Settings, 
  Bell, 
  User, 
  Menu, 
  X, 
  Zap,
  Globe,
  Terminal,
  Users,
  FileText,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface PremiumLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  rightPanelContent?: React.ReactNode;
  terminalContent?: React.ReactNode;
  showTerminal: boolean;
  onToggleTerminal: () => void;
}

const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  children,
  sidebarContent,
  rightPanelContent,
  terminalContent,
  showTerminal,
  onToggleTerminal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const sidebarVariants = {
    open: { width: '320px', opacity: 1 },
    collapsed: { width: '60px', opacity: 0.8 },
  };

  const rightPanelVariants = {
    open: { width: '280px', opacity: 1 },
    collapsed: { width: '0px', opacity: 0 },
  };

  const terminalVariants = {
    open: { height: '320px', opacity: 1 },
    closed: { height: '0px', opacity: 0 },
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Floating Top Bar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-dark border-b border-white/10 px-6 py-3 flex items-center justify-between z-50"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5 text-white/80" /> : <X className="w-5 h-5 text-white/80" />}
          </button>
          
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CodeCollab
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search files, commands, or help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full glass-dark text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-white/80" />}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all relative"
            >
              <Bell className="w-5 h-5 text-white/80" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>

          <button className="p-2 rounded-lg hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5 text-white/80" />
          </button>

          <div className="flex items-center space-x-2 pl-3 border-l border-white/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium">{user?.username}</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          variants={sidebarVariants}
          animate={sidebarCollapsed ? 'collapsed' : 'open'}
          initial="open"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="glass-dark border-r border-white/10 flex flex-col overflow-hidden"
        >
          {sidebarCollapsed ? (
            <div className="p-4 space-y-4">
              <button className="p-3 rounded-lg hover:bg-white/10 transition-all">
                <FileText className="w-5 h-5 text-white/80" />
              </button>
              <button className="p-3 rounded-lg hover:bg-white/10 transition-all">
                <Users className="w-5 h-5 text-white/80" />
              </button>
              <button className="p-3 rounded-lg hover:bg-white/10 transition-all">
                <Globe className="w-5 h-5 text-white/80" />
              </button>
            </div>
          ) : (
            sidebarContent
          )}
        </motion.aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col relative">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>

          {/* Floating Action Buttons */}
          <div className="absolute bottom-6 right-6 flex flex-col space-y-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleTerminal}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center neon-glow"
            >
              <Terminal className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </main>

        {/* Right Panel */}
        <motion.aside
          variants={rightPanelVariants}
          animate={rightPanelCollapsed ? 'collapsed' : 'open'}
          initial="open"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="glass-dark border-l border-white/10 overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-medium">Active Users</h3>
            <button
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="p-1 rounded hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          {rightPanelContent}
        </motion.aside>
      </div>

      {/* Terminal Panel */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            variants={terminalVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="glass-dark border-t border-white/10 overflow-hidden"
          >
            {terminalContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 right-6 w-80 glass-dark rounded-xl border border-white/20 z-50"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-medium">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4 text-white/60 text-center">
                No new notifications
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumLayout;
