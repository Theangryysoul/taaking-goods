import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export function useOwnerAuth(client = supabase) {
  const [state, setState] = useState({ loading: Boolean(client), session: null, owner: false, recovery: false, error: "" });
  const sequence = useRef(0);
  const alive = useRef(true);

  const check = useCallback(async (session, recovery = false) => {
    const request = ++sequence.current;
    if (!session) {
      if (alive.current) setState({ loading: false, session: null, owner: false, recovery: false, error: "" });
      return;
    }
    setState((current) => {
      const sameOwner = current.session?.user.id === session.user.id && current.owner;
      // Token refresh/focus checks must not unmount an in-progress editor.
      return { ...current, loading: !sameOwner, session, owner: Boolean(sameOwner), recovery: recovery || current.recovery, error: "" };
    });
    try {
      // Database membership is the authority; never trust user_metadata or email.
      const { data, error } = await client.rpc("is_catalog_admin");
      if (error) throw error;
      if (alive.current && request === sequence.current) setState((current) => ({ ...current, loading: false, owner: data === true, error: "" }));
    } catch {
      if (alive.current && request === sequence.current) setState((current) => ({ ...current, loading: false, owner: false, error: "Owner access could not be verified. Check the database migration and owner allowlist, then try signing in again." }));
    }
  }, [client]);

  useEffect(() => {
    alive.current = true;
    if (!client) return () => { alive.current = false; };
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      // Supabase auth callbacks must not await additional Supabase operations.
      // Defer the permission RPC until the auth callback has released its lock.
      setTimeout(() => { if (alive.current) check(session, event === "PASSWORD_RECOVERY"); }, 0);
    });
    client.auth.getSession().then(({ data, error }) => {
      if (!alive.current) return;
      if (error) setState({ loading: false, session: null, owner: false, recovery: false, error: "Sign-in could not be restored. Please sign in again." });
      else check(data.session);
    }).catch(() => {
      if (alive.current) setState({ loading: false, session: null, owner: false, recovery: false, error: "Sign-in could not be restored. Please sign in again." });
    });
    const onFocus = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const { data, error } = await client.auth.getSession();
        if (alive.current) check(error ? null : data.session);
      } catch { if (alive.current) check(null); }
    };
    window.addEventListener("focus", onFocus);
    return () => {
      alive.current = false;
      sequence.current += 1;
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [client, check]);

  return {
    ...state,
    signIn: async (email, password) => {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error("Sign-in failed. Check your email and password, then try again.");
      await check(data.session);
    },
    signOut: async () => {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new Error("Sign-out failed. Please try again.");
      await check(null);
    },
    requestReset: async (email) => {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/recovery` });
      if (error) throw new Error("The reset email could not be sent. Check the Auth email configuration and redirect URLs.");
    },
    resetPassword: async (password) => {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new Error("Password update failed. Use a fresh reset link and check the password requirements.");
      // Clear the recovered session after resetting, rather than leaving it signed in.
      const { error: signOutError } = await client.auth.signOut({ scope: "local" });
      if (signOutError) throw new Error("Your password was updated, but sign-out failed. Please sign out before continuing.");
      await check(null);
    },
  };
}
