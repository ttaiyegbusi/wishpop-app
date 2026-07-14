'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

// Two-step passwordless sign-in / sign-up: enter email → enter the 6-digit code
// we email back. Signing in claims this device's anonymous lists (handled by the
// store's auth listener), so nothing is lost.
export function SignInModal({ onClose }: { onClose: () => void }) {
  const { sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const codeValid = /^\d{6}$/.test(code.trim());

  async function onSendCode() {
    if (!emailValid || busy) return;
    setBusy(true);
    setError('');
    const err = await sendCode(email);
    setBusy(false);
    if (err) setError(err);
    else setStep('code');
  }

  async function onVerify() {
    if (!codeValid || busy) return;
    setBusy(true);
    setError('');
    const err = await verifyCode(email, code);
    setBusy(false);
    if (err) setError(err);
    else onClose(); // the store's auth listener reloads the account's lists
  }

  return (
    <div className="folder-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="folder-modal-card" onClick={(e) => e.stopPropagation()}>
        {step === 'email' ? (
          <>
            <h2 className="folder-modal-title">Sign in or sign up</h2>
            <p className="folder-modal-text">
              Enter your email and we’ll send you a 6-digit code. Your current wishlists stay with
              you.
            </p>
            <input
              className="folder-modal-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && emailValid) onSendCode();
              }}
            />
            {error ? <p className="folder-modal-error">{error}</p> : null}
            <div className="folder-modal-actions">
              <button className="folder-modal-btn ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="folder-modal-btn primary"
                disabled={!emailValid || busy}
                onClick={onSendCode}
              >
                {busy ? 'Sending…' : 'Send code'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="folder-modal-title">Enter your code</h2>
            <p className="folder-modal-text">
              We sent a 6-digit code to {email}. Enter it below.
            </p>
            <input
              className="folder-modal-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              aria-label="6-digit code"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && codeValid) onVerify();
              }}
            />
            {error ? <p className="folder-modal-error">{error}</p> : null}
            <div className="folder-modal-actions">
              <button
                className="folder-modal-btn ghost"
                disabled={busy}
                onClick={() => {
                  setCode('');
                  setError('');
                  setStep('email');
                }}
              >
                Back
              </button>
              <button
                className="folder-modal-btn primary"
                disabled={!codeValid || busy}
                onClick={onVerify}
              >
                {busy ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
