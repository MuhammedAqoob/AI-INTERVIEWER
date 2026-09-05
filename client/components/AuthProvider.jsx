'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { auth } from '../lib/api';

/*
 * Shared authentication state.
 *
 * The httpOnly JWT cookie remains the only credential and the backend
 * (GET /api/auth/me) remains the source of truth. This provider only fixes
 * how the frontend interprets the result:
 *
 *   status 'pending'        → a check is in flight (first attempt or its retry)
 *   status 'authenticated'  → /api/auth/me answered 200 with a user
 *   status 'guest'          → /api/auth/me answered an explicit 401
 *   status 'unavailable'    → the check AND its retry failed with transient
 *                             errors (timeout, network, 5xx). This is NOT
 *                             logged out — the session cookie may still be valid
 *                             while Render was waking or unreachable.
 *
 * Only an explicit 401 (or a logout) transitions to 'guest'. Everything else
 * keeps the UI neutral so a sleeping backend can never masquerade as a
 * logged-out session.
 */

const AuthContext = createContext(null);

const RETRY_DELAY_MS = 4000; // short pause so a cold Render instance can finish waking

// Module-scoped single in-flight check: every consumer shares one request.
let inFlight = null;

/** One /api/auth/me attempt. Resolves to the state it proves, or 'pending' for transient failures. */
async function checkOnce() {
  try {
    const res = await auth.me();
    const u = res?.data?.user;
    return u ? { status: 'authenticated', user: u } : { status: 'pending', user: null };
  } catch (err) {
    // Only an explicit 401 means the session is really gone.
    if (err && err.status === 401) return { status: 'guest', user: null };
    // Timeout (408), network (0), 500/503 and friends are transient.
    return { status: 'pending', user: null };
  }
}

/** Full cycle: one attempt, a short pause, one retry, then settle. */
async function runCheck() {
  let result = await checkOnce();
  if (result.status !== 'pending') return result;
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  result = await checkOnce();
  if (result.status !== 'pending') return result;
  return { status: 'unavailable', user: null };
}

function startCheck() {
  if (!inFlight) {
    inFlight = runCheck().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'pending', user: null });
  const stateRef = useRef(state);

  const apply = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // Run the initial check once on mount.
  useEffect(() => {
    startCheck().then((result) => apply(result));
  }, [apply]);

  /** Called after a successful login/register so the UI updates without a reload. */
  const markAuthenticated = useCallback((user) => {
    apply({ status: 'authenticated', user });
  }, [apply]);

  /** Called after logout, or anywhere a 401 proves the session is gone. */
  const markGuest = useCallback(() => {
    apply({ status: 'guest', user: null });
  }, [apply]);

  /**
   * Resolves once the current check cycle has settled (or immediately if it
   * already has). Never marks the user logged out — it only reports what the
   * backend proved.
   */
  const resolve = useCallback(() => {
    const current = stateRef.current;
    if (current.status !== 'pending') return Promise.resolve(current);
    return startCheck().then(() => stateRef.current);
  }, []);

  /** Starts a fresh check cycle (used for user-initiated retries). */
  const refresh = useCallback(() => startCheck().then(() => stateRef.current), []);

  return (
    <AuthContext.Provider
      value={{
        status: state.status,
        user: state.user,
        markAuthenticated,
        markGuest,
        resolve,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
