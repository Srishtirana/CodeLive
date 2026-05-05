import React, { useState, useEffect } from 'react';
import { File as FileType } from '../../types';
import { fileAPI } from '../../services/api';
import { FilePlus, File, Folder, Trash2, Edit3 } from 'lucide-react';

interface FileExplorerProps {
  workspaceId: string;
  selectedFile?: FileType;
  onSelectFile: (file: FileType) => void;
  onFileUpdate: (file: FileType) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  workspaceId,
  selectedFile,
  onSelectFile,
  onFileUpdate,
}) => {
  const [files, setFiles] = useState<FileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');

  useEffect(() => {
    loadFiles();
  }, [workspaceId]);

  const loadFiles = async () => {
    try {
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
      setFiles([...files, newFile]);
      setNewFileName('');
      setNewFileLanguage('javascript');
      setShowCreateForm(false);
      onSelectFile(newFile);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleDeleteFile = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileAPI.deleteFile(fileId);
      setFiles(files.filter(f => f._id !== fileId));
      if (selectedFile?._id === fileId) {
        onSelectFile(files[0]); // Select first available file
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
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

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Files</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <FilePlus className="h-5 w-5" />
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateFile} className="space-y-3">
            <input
              type="text"
              placeholder="File name (e.g., index.js)"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <select
              value={newFileLanguage}
              onChange={(e) => setNewFileLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FilePlus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No files yet</p>
            <p className="text-sm">Create your first file to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.language);
              const isSelected = selectedFile?._id === file._id;
              
              return (
                <div
                  key={file._id}
                  onClick={() => onSelectFile(file)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors mb-1 group ${
                    isSelected
                      ? 'bg-indigo-50 border-2 border-indigo-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFile(file._id, e)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
