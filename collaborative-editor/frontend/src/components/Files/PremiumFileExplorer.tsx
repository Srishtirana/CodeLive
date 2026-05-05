import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  FilePlus, 
  File, 
  Folder, 
  Trash2, 
  Edit3, 
  Search,
  Filter,
  Star,
  Clock,
  Hash,
  MoreVertical,
  X
} from 'lucide-react';
import { File as FileType } from '../../types';
import { fileAPI } from '../../services/api';

interface PremiumFileExplorerProps {
  workspaceId: string;
  selectedFile?: FileType;
  onSelectFile: (file: FileType) => void;
  onFileUpdate: (file: FileType) => void;
}

const PremiumFileExplorer: React.FC<PremiumFileExplorerProps> = ({
  workspaceId,
  selectedFile,
  onSelectFile,
  onFileUpdate,
}) => {
  const [files, setFiles] = useState<FileType[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileType } | null>(null);

  useEffect(() => {
    loadFiles();
  }, [workspaceId]);

  useEffect(() => {
    const filtered = files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modified':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });
    
    setFilteredFiles(sorted);
  }, [files, searchQuery, sortBy]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const data = await fileAPI.getFiles(workspaceId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFile = await fileAPI.createFile(
        workspaceId,
        newFileName,
        '',
        newFileLanguage,
        `/${newFileName}`
      );
      setFiles([newFile, ...files]);
      setNewFileName('');
      setNewFileLanguage('javascript');
      setShowCreateForm(false);
      onSelectFile(newFile);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleDeleteFile = async (file: FileType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      await fileAPI.deleteFile(file._id);
      setFiles(files.filter(f => f._id !== file._id));
      if (selectedFile?._id === file._id) {
        const remainingFiles = files.filter(f => f._id !== file._id);
        onSelectFile(remainingFiles[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileType) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const getFileIcon = (language: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      javascript: File,
      typescript: File,
      python: File,
      java: File,
      cpp: File,
      html: File,
      css: File,
      json: File,
    };
    return iconMap[language] || File;
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getLanguageColor = (language: string) => {
    const colorMap: { [key: string]: string } = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#007396',
      cpp: '#00599c',
      html: '#e34f26',
      css: '#1572b6',
      json: '#000000',
    };
    return colorMap[language] || '#6b7280';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const fileVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Files</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 neon-glow"
          >
            <FilePlus className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg glass-dark text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
          
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="p-2 rounded-lg glass-dark hover:bg-white/10 transition-all"
            >
              <Filter className="w-4 h-4 text-white/80" />
            </motion.button>
            
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-48 glass-dark rounded-xl border border-white/20 z-50"
                >
                  <div className="p-2">
                    <button
                      onClick={() => { setSortBy('name'); setShowSortMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm flex items-center space-x-2"
                    >
                      <Hash className="w-4 h-4" />
                      <span>Name</span>
                    </button>
                    <button
                      onClick={() => { setSortBy('modified'); setShowSortMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm flex items-center space-x-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Last Modified</span>
                    </button>
                    <button
                      onClick={() => { setSortBy('size'); setShowSortMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm flex items-center space-x-2"
                    >
                      <Hash className="w-4 h-4" />
                      <span>Size</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFiles.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <File className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-white font-medium mb-2">
              {searchQuery ? 'No files found' : 'No files yet'}
            </h3>
            <p className="text-white/60 text-sm">
              {searchQuery ? 'Try adjusting your search' : 'Create your first file to get started'}
            </p>
          </motion.div>
        ) : (
          <Reorder.Group axis="y" values={filteredFiles} onReorder={setFiles}>
            <AnimatePresence>
              {filteredFiles.map((file, index) => {
                const FileIcon = getFileIcon(file.language);
                const isSelected = selectedFile?._id === file._id;
                
                return (
                  <Reorder.Item key={file._id} value={file}>
                    <motion.div
                      layout
                      variants={fileVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectFile(file)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all mb-2 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-2 border-blue-400/50 neon-glow'
                          : 'glass-dark hover:bg-white/5 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getLanguageColor(file.language) + '20' }}
                        >
                          <FileIcon 
                            className="w-5 h-5" 
                            style={{ color: getLanguageColor(file.language) }} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{file.name}</h3>
                          <div className="flex items-center space-x-3 text-xs text-white/60 mt-1">
                            <span>{getFileExtension(file.name).toUpperCase()}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-white/10"
                        >
                          <Star className="w-4 h-4 text-white/60" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDeleteFile(file, e)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* Create File Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-dark rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Create New File</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              <form onSubmit={handleCreateFile} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm">File Name</label>
                  <input
                    type="text"
                    placeholder="index.js"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-lg glass-dark text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-white/60 text-sm">Language</label>
                  <select
                    value={newFileLanguage}
                    onChange={(e) => setNewFileLanguage(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-lg glass-dark text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="plaintext">Plain Text</option>
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Create File
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 rounded-lg glass-dark text-white font-medium hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed glass-dark rounded-xl border border-white/20 py-2 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => { /* Handle rename */ }}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => { /* Handle duplicate */ }}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <File className="w-4 h-4" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => handleDeleteFile(contextMenu.file, { stopPropagation: () => {} } as any)}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close context menu on click outside */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default PremiumFileExplorer;
