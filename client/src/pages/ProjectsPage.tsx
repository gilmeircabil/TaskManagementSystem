import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { IconFolder, IconPlus } from '../components/Icons';
import { ConfirmDialog, Modal } from '../components/Modal';
import { RowMenu } from '../components/RowMenu';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../format';
import type { Project } from '../types';

export function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    api<{ projects: Project[] }>('/projects')
      .then((data) => {
        setProjects(data.projects);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingProject) {
        await api(`/projects/${editingProject.id}`, {
          method: 'PATCH',
          body: { name: name.trim(), description: description.trim() },
        });
        toast('Project updated');
      } else {
        await api('/projects', {
          method: 'POST',
          body: { name: name.trim(), description: description.trim() },
        });
        toast('Project created');
      }
      setModalOpen(false);
      loadProjects();
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
      const res = await api<{ deleted: boolean; unassignedTasks: number }>(`/projects/${toDelete.id}`, {
        method: 'DELETE',
      });
      toast(`Project deleted (${res.unassignedTasks} task${res.unassignedTasks === 1 ? '' : 's'} unassigned)`);
      setToDelete(null);
      loadProjects();
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
          <h2>Projects</h2>
          <p className="muted">Group your tasks into high-level projects.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={16} /> New Project
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="muted center pad">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <IconFolder size={40} className="muted" />
          <p>No projects yet. Create one to organize your tasks!</p>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <IconPlus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div key={p.id} className="card project-card">
              <div className="project-card-header">
                <div className="project-title-area">
                  <h3 className="project-name">{p.name}</h3>
                  <span className="badge badge-secondary">{p.taskCount} tasks</span>
                </div>
                <RowMenu
                  label={`Actions for ${p.name}`}
                  actions={[
                    { label: 'Edit', onClick: () => openEdit(p) },
                    { label: 'Delete', danger: true, onClick: () => setToDelete(p) },
                  ]}
                />
              </div>
              <p className="project-desc">{p.description || <span className="muted italic">No description</span>}</p>
              <div className="project-card-footer">
                <span className="muted small">Created {formatDate(p.createdAt.slice(0, 10))}</span>
                <Link to={`/tasks?project=${p.id}`} className="btn btn-link btn-sm">
                  View Tasks →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingProject ? 'Edit Project' : 'New Project'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="project-form" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </>
          }
        >
          <form id="project-form" className="form" onSubmit={handleSave}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <label className="field">
              <span>Project Name *</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="e.g. Website Redesign"
                required
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="What is this project about?"
              />
            </label>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete project?"
          message={
            <>
              Are you sure you want to delete <strong>“{toDelete.name}”</strong>?
              <br />
              <span className="muted small">
                Tasks in this project will not be deleted; they will simply be unassigned.
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
