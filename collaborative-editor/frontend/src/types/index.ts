export interface User {
  id: string;
  username: string;
  email: string;
  color: string;
  avatar?: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner: User;
  members: WorkspaceMember[];
  files: File[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  user: User;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface File {
  _id: string;
  name: string;
  content: string;
  language: string;
  path: string;
  workspace: string;
  createdBy: User;
  lastModifiedBy: User;
  size: number;
  isFolder: boolean;
  yjsDocId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ActiveUser {
  id: string;
  username: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
