import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  fileContent?: string;
  language?: string;
}

const Terminal: React.FC<TerminalProps> = ({ fileContent, language }) => {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [outputs]);

  const executeCode = async () => {
    if (!fileContent || !language) {
      addOutput('No file selected or unsupported language', 'error');
      return;
    }

    setIsRunning(true);
    addOutput(`Running ${language} code...`, 'output');

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

  const stopExecution = () => {
    setIsRunning(false);
    addOutput('Execution stopped', 'output');
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;

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

  const addOutput = (content: string, type: 'input' | 'output' | 'error') => {
    const newOutput: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
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
    }
  };

  const getOutputColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'text-blue-600';
      case 'output':
        return 'text-gray-800';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono text-sm">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-xs">Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={executeCode}
            disabled={isRunning || !fileContent}
            className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            <Play className="h-3 w-3" />
            <span>Run</span>
          </button>
          {isRunning && (
            <button
              onClick={stopExecution}
              className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
            >
              <Square className="h-3 w-3" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-y-auto"
        onClick={() => inputRef.current?.focus()}
      >
        {outputs.map((output) => (
          <div key={output.id} className={`mb-1 ${getOutputColor(output.type)}`}>
            {output.type === 'input' && <span className="text-gray-500">$ </span>}
            {output.content}
          </div>
        ))}
        
        {outputs.length === 0 && (
          <div className="text-gray-500">
            Welcome to the terminal. Type a command or run your code.
          </div>
        )}
      </div>

      <form onSubmit={handleCommandSubmit} className="p-2 border-t border-gray-700">
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-green-400 placeholder-gray-500"
            placeholder="Enter command..."
            disabled={isRunning}
          />
        </div>
      </form>
    </div>
  );
};

export default Terminal;
