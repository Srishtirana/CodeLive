import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { motion, AnimatePresence } from 'framer-motion';
import { File as FileType, ActiveUser } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Save, 
  Users, 
  Zap, 
  Copy, 
  Download,
  Share,
  History,
  Play
} from 'lucide-react';

interface PremiumCollaborativeEditorProps {
  file: FileType;
  onContentChange?: (content: string) => void;
  onRunCode?: () => void;
  isRunning?: boolean;
}

const PremiumCollaborativeEditor: React.FC<PremiumCollaborativeEditorProps> = ({ 
  file, 
  onContentChange, 
  onRunCode,
  isRunning = false 
}) => {
  const { user } = useAuth();
  const editorRef = useRef<any>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file.yjsDocId || !user) return;

    const ydoc = new Y.Doc();
    const yText = ydoc.getText('monaco');

    // Initialize with file content
    if (file.content && yText.length === 0) {
      yText.insert(0, file.content);
    }

    // Create WebSocket provider
    const wsProvider = new WebsocketProvider(
      'ws://localhost:5000/yjs',
      file.yjsDocId,
      ydoc,
      {
        connect: true,
      }
    );

    setProvider(wsProvider);

    // Connection status
    wsProvider.on('status', (event: any) => {
      setConnectionStatus(event.status);
    });

    // Set up awareness for cursor tracking
    const awareness = wsProvider.awareness;
    
    awareness.setLocalStateField('user', {
      name: user.username,
      color: user.color,
      id: user.id,
    });

    awareness.on('change', () => {
      const users = Array.from(awareness.getStates().entries()).map(([clientId, state]: [number, any]) => ({
        id: state.user?.id || clientId.toString(),
        username: state.user?.name || 'Anonymous',
        color: state.user?.color || '#000000',
        cursor: state.cursor,
        selection: state.selection,
      }));
      setActiveUsers(users);
    });

    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [file.yjsDocId, user, file.content]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;

    if (provider && file.yjsDocId) {
      const ydoc = provider.doc;
      const yText = ydoc.getText('monaco');

      // Create Monaco binding
      const monacoBinding = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
      );

      // Custom cursor decorations
      const decorations: string[] = [];
      
      // Update cursor decorations when awareness changes
      provider.awareness.on('change', () => {
        const states = provider.awareness.getStates();
        const newDecorations: any[] = [];
        
        states.forEach((state: any, clientId: number) => {
          if (clientId !== provider.awareness.clientID && state.user && state.cursor) {
            newDecorations.push({
              range: new monaco.Range(
                state.cursor.line,
                state.cursor.column,
                state.cursor.line,
                state.cursor.column
              ),
              options: {
                className: `remote-cursor-${clientId}`,
                hoverMessage: { value: `${state.user.name} is here` },
                afterContentClassName: `cursor-label-${clientId}`,
                afterContent: state.user.name,
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              }
            });
          }
        });
        
        editor.deltaDecorations(decorations, newDecorations);
      });

      // Auto-save functionality with visual feedback
      let saveTimeout: NodeJS.Timeout;
      const handleContentChange = () => {
        setIsSaving(true);
        setSaveStatus('saving');
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          const content = editor.getValue();
          onContentChange?.(content);
          setIsSaving(false);
          setSaveStatus('saved');
          
          // Show saved animation
          setTimeout(() => setSaveStatus('saved'), 1000);
        }, 1000);
      };

      editor.onDidChangeModelContent(handleContentChange);

      // Add custom styles for remote cursors
      const style = document.createElement('style');
      style.textContent = `
        ${Array.from(provider.awareness.getStates().keys()).map(clientId => `
          .remote-cursor-${clientId} {
            border-left: 2px solid var(--cursor-color);
            background-color: var(--cursor-color);
            opacity: 0.7;
          }
          .cursor-label-${clientId}::after {
            content: attr(data-content);
            position: absolute;
            top: -20px;
            left: 0;
            background: var(--cursor-color);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
          }
        `).join('')}
      `;
      document.head.appendChild(style);

      return () => {
        monacoBinding.destroy();
        clearTimeout(saveTimeout);
        document.head.removeChild(style);
      };
    }
  }, [provider, file.yjsDocId, onContentChange]);

  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const handleCopy = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getValue());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/workspace/${file.workspace}/file/${file._id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = editorRef.current?.getValue() || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved': return <Save className="w-4 h-4 text-green-400" />;
      case 'saving': return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'error': return <div className="w-4 h-4 bg-red-400 rounded-full" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Premium Header with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark border-b border-white/10 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {file.name.split('.').pop()?.toUpperCase() || 'TXT'}
                </span>
              </div>
              <div>
                <h2 className="text-white font-semibold">{file.name}</h2>
                <div className="flex items-center space-x-2 text-xs text-white/60">
                  <span>{getLanguageFromExtension(file.name)}</span>
                  <span>•</span>
                  <span>{file.content.length} characters</span>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="flex items-center space-x-2">
              <AnimatePresence>
                {activeUsers.slice(0, 3).map((activeUser, index) => (
                  <motion.div
                    key={activeUser.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: activeUser.color + '20', 
                      color: activeUser.color,
                      border: `1px solid ${activeUser.color}40`
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: activeUser.color }}
                    />
                    <span>{activeUser.username}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeUsers.length > 3 && (
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium glass-dark">
                  <Users className="w-3 h-3" />
                  <span>+{activeUsers.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full glass-dark">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
              <span className="text-xs text-white/60 capitalize">{connectionStatus}</span>
            </div>

            {/* Save Status */}
            <div className="flex items-center space-x-1 px-3 py-1 rounded-full glass-dark">
              {getSaveStatusIcon()}
              <span className="text-xs text-white/60 capitalize ml-1">{saveStatus}</span>
            </div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="p-2 rounded-lg glass-dark hover:bg-white/10 transition-all"
              title="Copy Code"
            >
              <Copy className="w-4 h-4 text-white/80" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareDialog(!showShareDialog)}
              className="p-2 rounded-lg glass-dark hover:bg-white/10 transition-all"
              title="Share"
            >
              <Share className="w-4 h-4 text-white/80" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg glass-dark hover:bg-white/10 transition-all"
              title="Version History"
            >
              <History className="w-4 h-4 text-white/80" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="p-2 rounded-lg glass-dark hover:bg-white/10 transition-all"
              title="Download"
            >
              <Download className="w-4 h-4 text-white/80" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRunCode}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                isRunning 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 neon-glow-green'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Code</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={getLanguageFromExtension(file.name)}
          value={file.content}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            padding: { top: 20, bottom: 20 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />

        {/* Copy Success Toast */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 right-4 px-4 py-2 rounded-lg glass-dark border border-green-400/30 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-white text-sm">Copied to clipboard!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Dialog */}
      <AnimatePresence>
        {showShareDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowShareDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-dark rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Share {file.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm">Share Link</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      value={`${window.location.origin}/workspace/${file.workspace}/file/${file._id}`}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg glass-dark text-white"
                    />
                    <button
                      onClick={handleShare}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm">Permissions</label>
                  <select className="w-full mt-1 px-3 py-2 rounded-lg glass-dark text-white">
                    <option>Can edit</option>
                    <option>Can comment</option>
                    <option>Can view</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumCollaborativeEditor;
