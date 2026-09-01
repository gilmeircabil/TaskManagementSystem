import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile]);

  const initial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase();

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarUrl || null });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <div className="lede">Manage your personal information.</div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel" style={{ textAlign: 'center' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="avatar-lg"
              style={{ objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="avatar-lg">{initial}</div>
          )}
          <div style={{ fontWeight: 700 }}>{profile?.full_name || 'Unnamed User'}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{user?.email}</div>
        </div>

        <div className="panel">
          <div className="panel-title">Account details</div>
          <div className="panel-sub">Update your name and avatar.</div>

          <form onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="avatarUrl">Avatar URL (optional)</label>
              <input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" value={user?.email || ''} disabled />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
