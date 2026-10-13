import { Schema, model, type Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  color: string | null;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    color: { type: String, default: null, match: /^#[0-9a-fA-F]{6}$/ },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Category names are unique per user, case-insensitively ("Work" == "work").
categorySchema.index(
  { user: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export const Category = model<ICategory>('Category', categorySchema);

export function serializeCategory(c: ICategory, taskCount = 0) {
  return {
    id: c._id.toString(),
    name: c.name,
    color: c.color ?? null,
    createdAt: c.createdAt,
    taskCount,
  };
}
