'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { deleteAccount } from '@/actions/auth.actions';

// Account management: show the signed-in email, sign out, or permanently delete
// the account (which cascades the user's wishlists). Reached from the home menu.
export function AccountModal({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSignOut() {
    if (busy) return;
    setBusy(true);
    await signOut();
    onClose();
  }

  async function onDelete() {
    if (busy) return;
    setBusy(true);
    setError('');
    const ok = await deleteAccount();
    if (!ok) {
      setBusy(false);
      setError('Could not delete your account. Please try again.');
      return;
    }
    // Clear the now-orphaned session; the store then falls back to (empty) local.
    await signOut();
    onClose();
  }

  return (
    <div className="folder-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="folder-modal-card" onClick={(e) => e.stopPropagation()}>
        {confirming ? (
          <>
            <h2 className="folder-modal-title">Delete account?</h2>
            <p className="folder-modal-text">
              This permanently deletes your account and all your wishlists. This can’t be undone.
            </p>
            {error ? <p className="folder-modal-error">{error}</p> : null}
            <div className="folder-modal-actions">
              <button
                className="folder-modal-btn ghost"
                disabled={busy}
                onClick={() => {
                  setConfirming(false);
                  setError('');
                }}
              >
                Cancel
              </button>
              <button className="folder-modal-btn danger" disabled={busy} onClick={onDelete}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="folder-modal-title">Account</h2>
            <p className="folder-modal-text">Signed in as</p>
            <p className="account-email">{user?.email}</p>
            <div className="folder-modal-actions account-actions">
              <button className="folder-modal-btn ghost" disabled={busy} onClick={onSignOut}>
                Sign out
              </button>
              <button
                className="folder-modal-btn danger"
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                Delete account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
