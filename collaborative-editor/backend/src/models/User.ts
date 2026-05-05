import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  color: string;
  workspaces: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  color: { type: String, required: true, default: '#3B82F6' },
  workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }]
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', userSchema);
