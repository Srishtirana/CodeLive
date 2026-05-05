import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  name: string;
  content: string;
  language: string;
  path: string;
  workspace: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  size: number;
  isFolder: boolean;
  parent?: mongoose.Types.ObjectId;
  children?: mongoose.Types.ObjectId[];
  yjsDocId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>({
  name: { type: String, required: true },
  content: { type: String, default: '' },
  language: { type: String, default: 'plaintext' },
  path: { type: String, required: true },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  size: { type: Number, default: 0 },
  isFolder: { type: Boolean, default: false },
  parent: { type: Schema.Types.ObjectId, ref: 'File' },
  children: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  yjsDocId: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IFile>('File', fileSchema);
