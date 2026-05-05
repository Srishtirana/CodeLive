import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { File as FileType, ActiveUser } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface CollaborativeEditorProps {
  file: FileType;
  onContentChange?: (content: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ file, onContentChange }) => {
  const { user } = useAuth();
  const editorRef = useRef<any>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<ActiveUser[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, any>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      'ws://localhost:5001/yjs',
      file.yjsDocId,
      ydoc,
      {
        connect: true,
      }
    );

    setProvider(wsProvider);

    // Set up awareness for cursor tracking
    const awareness = wsProvider.awareness;
    
    awareness.setLocalStateField('user', {
      name: user.username,
      color: user.color,
      id: user.id,
    });

    awareness.on('change', () => {
      const states = awareness.getStates();
      const users = Array.from(states.entries()).map(([clientId, state]: [number, any]) => {
        const userData = {
          id: state.user?.id || clientId.toString(),
          username: state.user?.name || 'Anonymous',
          color: state.user?.color || '#000000',
          cursor: state.cursor,
          selection: state.selection,
          isTyping: state.isTyping || false,
        };
        
        // Update cursor positions
        if (state.cursor) {
          setCursorPositions(prev => new Map(prev.set(userData.id, state.cursor)));
        }
        
        return userData;
      });
      
      setActiveUsers(users);
      
      // Update typing users
      const currentlyTyping = users.filter(u => u.isTyping && u.id !== user?.id);
      setTypingUsers(currentlyTyping);
    });

    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [file.yjsDocId, user, file.content]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    if (provider && file.yjsDocId) {
      const ydoc = provider.doc;
      const yText = ydoc.getText('monaco');
      const awareness = provider.awareness;

      // Create Monaco binding
      const monacoBinding = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        awareness
      );

      // Typing detection and auto-save
      let saveTimeout: NodeJS.Timeout;
      const handleContentChange = () => {
        // Set typing state
        awareness.setLocalStateField('isTyping', true);
        
        // Clear previous typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Clear typing state after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          awareness.setLocalStateField('isTyping', false);
        }, 2000);
        
        // Auto-save logic
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          const content = editor.getValue();
          onContentChange?.(content);
        }, 1000);
      };

      // Cursor position tracking
      const handleCursorPositionChange = () => {
        const position = editor.getPosition();
        if (position) {
          awareness.setLocalStateField('cursor', {
            line: position.lineNumber,
            column: position.column,
          });
        }
      };

      editor.onDidChangeModelContent(handleContentChange);
      editor.onDidChangeCursorPosition(handleCursorPositionChange);

      return () => {
        monacoBinding.destroy();
        clearTimeout(saveTimeout);
      };
    }
  };

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

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-700 p-3 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-100">{file.name}</span>
              <span className="text-xs text-gray-400">{getLanguageFromExtension(file.name)}</span>
            </div>
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-1 text-xs text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} users are typing...`
                  }
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <span>{activeUsers.length} active</span>
            </div>
            {activeUsers.slice(0, 3).map((activeUser) => (
              <div
                key={activeUser.id}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs border"
                style={{ 
                  backgroundColor: activeUser.color + '20', 
                  color: activeUser.color,
                  borderColor: activeUser.color + '40'
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: activeUser.color }}
                />
                <span>{activeUser.username}</span>
                {activeUser.cursor && (
                  <span className="text-xs opacity-70">
                    L{activeUser.cursor.line + 1}
                  </span>
                )}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                <span>+{activeUsers.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1">
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
          }}
        />
      </div>
    </div>
  );
};

export default CollaborativeEditor;
