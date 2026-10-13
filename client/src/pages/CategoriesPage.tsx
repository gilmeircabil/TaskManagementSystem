import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { IconPlus, IconTag } from '../components/Icons';
import { ConfirmDialog, Modal } from '../components/Modal';
import { RowMenu } from '../components/RowMenu';
import { useToast } from '../context/ToastContext';
import type { Category } from '../types';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
];

export function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = () => {
    setLoading(true);
    api<{ categories: Category[] }>('/categories')
      .then((data) => {
        setCategories(data.categories);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setColor('#3b82f6');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setColor(c.color || '#3b82f6');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingCategory) {
        await api(`/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: { name: name.trim(), color: color || null },
        });
        toast('Category updated');
      } else {
        await api('/categories', {
          method: 'POST',
          body: { name: name.trim(), color: color || null },
        });
        toast('Category created');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await api<{ deleted: boolean; unassignedTasks: number }>(`/categories/${toDelete.id}`, {
        method: 'DELETE',
      });
      toast(`Category deleted (${res.unassignedTasks} task${res.unassignedTasks === 1 ? '' : 's'} unassigned)`);
      setToDelete(null);
      loadCategories();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p className="muted">Organize and tag your tasks with color-coded categories.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={16} /> New Category
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="muted center pad">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="card empty-state">
          <IconTag size={40} className="muted" />
          <p>No categories yet. Create categories like "Work", "Personal", or "Urgent"!</p>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <IconPlus size={16} /> Create Category
          </button>
        </div>
      ) : (
        <div className="category-grid">
          {categories.map((c) => (
            <div key={c.id} className="card category-card">
              <div className="category-card-header">
                <div className="category-title-area">
                  <span className="color-swatch-lg" style={{ backgroundColor: c.color || '#94a3b8' }} />
                  <h3 className="category-name">{c.name}</h3>
                </div>
                <RowMenu
                  label={`Actions for ${c.name}`}
                  actions={[
                    { label: 'Edit', onClick: () => openEdit(c) },
                    { label: 'Delete', danger: true, onClick: () => setToDelete(c) },
                  ]}
                />
              </div>
              <div className="category-card-footer">
                <span className="badge badge-secondary">{c.taskCount} tasks</span>
                <Link to={`/tasks?category=${c.id}`} className="btn btn-link btn-sm">
                  Filter Tasks →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingCategory ? 'Edit Category' : 'New Category'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="category-form" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </>
          }
        >
          <form id="category-form" className="form" onSubmit={handleSave}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <label className="field">
              <span>Category Name *</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Work, Errands, Health"
                required
              />
            </label>
            <div className="field">
              <span>Color Tag</span>
              <div className="color-picker-row">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={`color-preset-btn ${color.toLowerCase() === hex ? 'selected' : ''}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => setColor(hex)}
                    aria-label={`Select color ${hex}`}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="color-input-native"
                  title="Custom color"
                  aria-label="Custom category color"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete category?"
          message={
            <>
              Are you sure you want to delete category <strong>“{toDelete.name}”</strong>?
              <br />
              <span className="muted small">
                Tasks with this category will not be deleted; the category tag will be unassigned.
              </span>
            </>
          }
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
