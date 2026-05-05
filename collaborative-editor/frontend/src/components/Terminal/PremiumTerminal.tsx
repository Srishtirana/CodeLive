import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Terminal as TerminalIcon, 
  Copy, 
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
  command?: string;
}

interface PremiumTerminalProps {
  fileContent?: string;
  language?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
}

const PremiumTerminal: React.FC<PremiumTerminalProps> = ({ 
  fileContent, 
  language,
  isExpanded = false,
  onToggleExpand,
  onClose
}) => {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [outputs]);

  useEffect(() => {
    // Focus input when terminal is shown
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const executeCode = async () => {
    if (!fileContent || !language) {
      addOutput('No file selected or unsupported language', 'error');
      return;
    }

    setIsRunning(true);
    addOutput(`Running ${language} code...`, 'info');

    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code: fileContent,
          language,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addOutput(result.output, 'output');
      } else {
        addOutput(result.error || 'Execution failed', 'error');
      }
    } catch (error) {
      addOutput('Failed to connect to execution service', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;

    const commandOutput: TerminalOutput = {
      id: Date.now().toString(),
      type: 'input',
      content: currentInput,
      timestamp: new Date(),
      command: currentInput,
    };
    
    addOutput(currentInput, 'input');
    
    // Add to history
    const newHistory = [...history, currentInput];
    setHistory(newHistory);
    setHistoryIndex(-1);

    try {
      const response = await fetch('http://localhost:5000/api/terminal/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ command: currentInput }),
      });

      const result = await response.json();
      
      if (result.success) {
        addOutput(result.output, 'output');
      } else {
        addOutput(result.error, 'error');
      }
    } catch (error) {
      addOutput(`Command not found: ${currentInput}`, 'error');
    }

    setCurrentInput('');
  };

  const addOutput = (content: string, type: 'input' | 'output' | 'error' | 'info', command?: string) => {
    const newOutput: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      command,
    };
    setOutputs(prev => [...prev, newOutput]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic tab completion logic could be implemented here
    }
  };

  const copyOutput = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedCommand(content);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const clearTerminal = () => {
    setOutputs([]);
  };

  const getOutputColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'text-cyan-400';
      case 'output':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'input':
        return '❯';
      case 'error':
        return '✗';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  const terminalVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: isExpanded ? '60vh' : '320px', opacity: 1 },
  };

  return (
    <motion.div
      variants={terminalVariants}
      initial="collapsed"
      animate="expanded"
      exit="collapsed"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="glass-dark border-t border-white/10 flex flex-col"
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="w-4 h-4 text-green-400" />
            <span className="text-white font-medium text-sm">Terminal</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-xs text-white/60">{connectionStatus}</span>
          </div>

          {fileContent && (
            <div className="flex items-center space-x-2 px-2 py-1 rounded-full glass-dark">
              <span className="text-xs text-white/60">Language:</span>
              <span className="text-xs text-white font-medium">{language}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearTerminal}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
            title="Clear Terminal"
          >
            <X className="w-4 h-4 text-white/60" />
          </motion.button>

          {fileContent && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={executeCode}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                isRunning 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Run Code</span>
                </>
              )}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4 text-white/60" /> : <Maximize2 className="w-4 h-4 text-white/60" />}
          </motion.button>

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-all"
            >
              <X className="w-4 h-4 text-red-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence>
          {outputs.map((output, index) => (
            <motion.div
              key={output.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.02 }}
              className={`mb-2 ${getOutputColor(output.type)} group relative`}
            >
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 select-none">
                  {getOutputIcon(output.type)}
                </span>
                <div className="flex-1 break-all">
                  <pre className="whitespace-pre-wrap font-mono">{output.content}</pre>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyOutput(output.content)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                >
                  <Copy className="w-3 h-3 text-white/60" />
                </motion.button>
              </div>
              
              {/* Copy feedback */}
              <AnimatePresence>
                {copiedCommand === output.content && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-0 px-2 py-1 bg-green-500 text-white text-xs rounded"
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {outputs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <TerminalIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/60">Welcome to the terminal</p>
            <p className="text-white/40 text-sm mt-2">Type a command or run your code</p>
          </motion.div>
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={handleCommandSubmit} className="border-t border-white/10 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 font-mono select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-white font-mono placeholder-white/40"
            placeholder="Enter command..."
            disabled={isRunning}
          />
          {history.length > 0 && (
            <div className="flex items-center space-x-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => {
                  if (historyIndex < history.length - 1) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    setCurrentInput(history[history.length - 1 - newIndex]);
                  }
                }}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-50"
                disabled={historyIndex >= history.length - 1}
              >
                <ChevronUp className="w-4 h-4 text-white/60" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => {
                  if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    setCurrentInput(history[history.length - 1 - newIndex]);
                  } else if (historyIndex === 0) {
                    setHistoryIndex(-1);
                    setCurrentInput('');
                  }
                }}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-50"
                disabled={historyIndex <= 0}
              >
                <ChevronDown className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default PremiumTerminal;
