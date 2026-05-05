import React, { useState, useEffect } from 'react';
import { Workspace } from '../../types';
import { workspaceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FolderPlus, Users, Settings } from 'lucide-react';

interface WorkspaceListProps {
  onSelectWorkspace: (workspace: Workspace) => void;
  selectedWorkspaceId?: string;
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({ onSelectWorkspace, selectedWorkspaceId }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await workspaceAPI.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newWorkspace = await workspaceAPI.createWorkspace(newWorkspaceName, newWorkspaceDescription);
      setWorkspaces([...workspaces, newWorkspace]);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setShowCreateForm(false);
      onSelectWorkspace(newWorkspace);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
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
          <h2 className="text-lg font-semibold text-gray-900">Workspaces</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <FolderPlus className="h-5 w-5" />
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateWorkspace} className="space-y-3">
            <input
              type="text"
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
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
        {workspaces.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderPlus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No workspaces yet</p>
            <p className="text-sm">Create your first workspace to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() => onSelectWorkspace(workspace)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedWorkspaceId === workspace._id
                    ? 'bg-indigo-50 border-2 border-indigo-200'
                    : 'bg-white border-2 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                    {workspace.description && (
                      <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
                    )}
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {workspace.members.length}
                      </div>
                      <div>{workspace.files.length} files</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle settings
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceList;
