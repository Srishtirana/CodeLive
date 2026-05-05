import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import WorkspaceList from './components/Workspace/WorkspaceList';
import FileExplorer from './components/Files/FileExplorer';
import CollaborativeEditor from './components/Editor/CollaborativeEditor';
import Terminal from './components/Terminal/Terminal';
import { Workspace, File as FileType } from './types';
import { LogOut, Users, Settings, X } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  const handleFileUpdate = (updatedFile: FileType) => {
    setSelectedFile(updatedFile);
  };

  const handleRunCode = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch('http://localhost:5001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code: selectedFile.content,
          language: selectedFile.language || 'javascript',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show output in terminal
        setShowTerminal(true);
        // The terminal component will display the output
      } else {
        console.error('Execution failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to execute code:', error);
    }
  };

  if (!selectedWorkspace) {
    return (
      <div className="flex h-screen bg-gray-900">
        <motion.div 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-80 border-r border-gray-700 bg-gray-800"
        >
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-400">CodeCollab</h1>
              <div className="flex items-center space-x-2">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
                >
                  <Users className="h-5 w-5" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
                >
                  <Settings className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Welcome back, {user?.username}
            </div>
          </div>
          <WorkspaceList
            onSelectWorkspace={setSelectedWorkspace}
            selectedWorkspaceId=""
          />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              📁
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-2xl font-semibold text-gray-100 mb-2"
            >
              Select a workspace
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-gray-400"
            >
              Choose a workspace from sidebar to start collaborating
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-80 border-r border-gray-700 bg-gray-800 flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <h1 className="text-xl font-bold text-blue-400">CodeCollab</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all">
                <Users className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all">
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 pl-11">
            <div className="text-sm font-medium text-gray-100">{selectedWorkspace.name}</div>
            <div className="text-xs text-gray-400 mt-1">Welcome back, {user?.username}</div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <FileExplorer
            workspaceId={selectedWorkspace._id}
            selectedFile={selectedFile || undefined}
            onSelectFile={setSelectedFile}
            onFileUpdate={handleFileUpdate}
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 border-b border-gray-700 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center"
                  >
                    <span className="text-white font-bold text-xs">{selectedFile.name.split('.').pop()?.toUpperCase() || 'TXT'}</span>
                  </motion.div>
                  <div>
                    <h3 className="text-white font-medium">{selectedFile.name}</h3>
                    <div className="text-xs text-gray-400">{selectedFile.language || 'Plain Text'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRunCode}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Run Code
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    Save
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1 flex">
          {selectedFile ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-1"
            >
              <CollaborativeEditor
                file={selectedFile}
                onContentChange={(content) => {
                  const handleRunCode = async () => {
                    if (!selectedFile) return;
                    
                    try {
                      const response = await fetch('http://localhost:5001/api/execute', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify({
                          code: selectedFile.content,
                          language: selectedFile.language || 'javascript',
                        }),
                      });

                      const result = await response.json();
                      
                      if (result.success) {
                        // Show output in terminal
                        setShowTerminal(true);
                        // The terminal component will display the output
                      } else {
                        console.error('Execution failed:', result.error);
                      }
                    } catch (error) {
                      console.error('Failed to execute code:', error);
                    }
                  };
                }}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-6xl mb-4"
                >
                  📝
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-2xl font-semibold text-gray-100 mb-2"
                >
                  Select a file
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-gray-400"
                >
                  Choose a file from sidebar to start editing
                </motion.p>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showTerminal && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 256, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-gray-700 bg-gray-900 overflow-hidden"
            >
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-medium">Terminal</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
              <div className="h-64">
                <Terminal
                  fileContent={selectedFile?.content}
                  language={selectedFile?.language}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-gray-700 bg-gray-800 p-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTerminal(!showTerminal)}
              className={`px-4 py-2 rounded text-sm transition-all ${
                showTerminal
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
            </motion.button>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>Ready</span>
              <span>•</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

function AppWithProvider() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithProvider;
