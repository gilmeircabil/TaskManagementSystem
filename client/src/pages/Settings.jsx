import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { requestPasswordReset } from '../services/authService';

const CURRENCIES = [
  { code: 'PHP', label: 'Philippine Peso (₱)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
];

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const [currency, setCurrency] = useState('PHP');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    setCurrency(profile?.currency || 'PHP');
  }, [profile]);

  async function handleSaveCurrency(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ currency });
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await requestPasswordReset(user.email);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.message || 'Could not send reset email');
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <div className="lede">Preferences and account security.</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18, maxWidth: 480 }}>
        <div className="panel-title">Currency</div>
        <div className="panel-sub">Choose the currency used across your dashboard.</div>
        <form onSubmit={handleSaveCurrency}>
          <div className="field">
            <label htmlFor="currency">Display currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </form>
      </div>

      <div className="panel" style={{ maxWidth: 480 }}>
        <div className="panel-title">Security</div>
        <div className="panel-sub">Send yourself a link to reset your password.</div>
        <button className="btn btn-outline" onClick={handlePasswordReset} disabled={sendingReset}>
          {sendingReset ? 'Sending…' : 'Send Password Reset Email'}
        </button>
      </div>
    </div>
  );
}
