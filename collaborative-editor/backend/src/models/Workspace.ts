import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    joinedAt: Date;
  }>;
  files: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'editor' },
    joinedAt: { type: Date, default: Date.now }
  }],
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }]
}, {
  timestamps: true
});

export default mongoose.model<IWorkspace>('Workspace', workspaceSchema);
