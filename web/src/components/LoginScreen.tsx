import { useState } from 'react';
import { Wallet2, Lock } from 'lucide-react';
import { login } from '../lib/authConfig';

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(username, password)) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-[360px] rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hero)] text-white">
            <Wallet2 size={22} />
          </div>
          <h1 className="font-display text-xl">Cashbook</h1>
          <p className="text-sm text-[var(--muted)]">Sign in to continue</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Username</label>
          <input
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false); }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
            autoFocus
          />
        </div>
        <div className="mb-2">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Password</label>
          <input
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            type="password"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none"
          />
        </div>
        {error && <p className="mb-3 text-xs" style={{ color: 'var(--expense)' }}>Wrong username or password.</p>}

        <button
          type="submit"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--hero)] py-3 text-sm font-semibold text-white"
        >
          <Lock size={15} /> Sign In
        </button>
      </form>
    </div>
  );
}
