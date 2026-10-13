import { Schema, model, type Types } from 'mongoose';

export interface IProject {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  description: string;
  createdAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

projectSchema.index({ user: 1, name: 1 });

export const Project = model<IProject>('Project', projectSchema);

export function serializeProject(p: IProject, taskCount = 0) {
  return {
    id: p._id.toString(),
    name: p.name,
    description: p.description ?? '',
    createdAt: p.createdAt,
    taskCount,
  };
}
