import { useState } from "react";
import { ArrowLeft, LockKey, SignIn } from "@phosphor-icons/react";

export default function OwnerLogin({ auth, recoveryPage = false }) {
  const [reset, setReset] = useState(recoveryPage);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const recovering = recoveryPage && auth.session && auth.owner;

  const submit = async (event) => {
    event.preventDefault();
    setStatus(null);
    if (busy) return;
    if (recovering) {
      if (password.length < 12 || password !== confirmation) {
        setStatus({ error: true, text: "Use at least 12 characters and enter the same password twice." }); return;
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus({ error: true, text: "Enter a valid email address." }); return;
    }
    setBusy(true);
    try {
      if (recovering) {
        await auth.resetPassword(password);
        setPassword(""); setConfirmation("");
        setStatus({ error: false, text: "Password updated. Return to owner sign-in and use your new password." });
      } else if (reset) {
        await auth.requestReset(email);
        setStatus({ error: false, text: "If this email belongs to an account, a reset link will arrive shortly. Open it in this browser." });
      } else await auth.signIn(email, password);
    } catch (error) { setStatus({ error: true, text: error.message }); }
    finally { setBusy(false); }
  };

  return <section className="admin-login admin-panel" aria-labelledby="owner-login-title">
    <LockKey size={28} weight="light" aria-hidden="true" />
    <p className="eyebrow">Private owner access</p>
    <h1 className="heading-4" id="owner-login-title">{recovering ? "Set a new password" : reset ? "Reset your password" : "Welcome back."}</h1>
    <p className="body-3">{recovering ? "Choose a password you do not use elsewhere." : reset ? "Enter your owner email to receive a secure reset link." : "Sign in to update products, prices and photos."}</p>
    {recoveryPage && !auth.session && <p className="admin-status" role="status">Open the latest reset link in the browser that requested it. If the link expired, request a new one below.</p>}
    <form onSubmit={submit} noValidate>
      <fieldset disabled={busy}>
        {!recovering && <div className="field"><label htmlFor="owner-email">Email</label><input id="owner-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>}
        {(recovering || !reset) && <div className="field"><label htmlFor="owner-password">{recovering ? "New password" : "Password"}</label><input id="owner-password" type="password" autoComplete={recovering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={recovering ? 12 : undefined} required /></div>}
        {recovering && <div className="field"><label htmlFor="owner-confirm">Repeat new password</label><input id="owner-confirm" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>}
        <button className="btn btn--primary" type="submit"><SignIn size={18} aria-hidden="true" />{busy ? "Please wait…" : recovering ? "Update password" : reset ? "Send reset link" : "Sign in"}</button>
      </fieldset>
    </form>
    {status && <p className={`admin-status${status.error ? " admin-status--error" : ""}`} role={status.error ? "alert" : "status"}>{status.text}</p>}
    {!recoveryPage && <button className="link-arrow" type="button" onClick={() => { setReset(!reset); setStatus(null); }} disabled={busy}>{reset ? <><ArrowLeft size={16} /> Back to sign-in</> : "Forgot password?"}</button>}
    {recoveryPage && <a className="link-arrow" href="/admin"><ArrowLeft size={16} /> Back to owner sign-in</a>}
    <p className="caption-2">Only accounts approved in the owner allowlist can manage the catalogue. There is no public registration.</p>
  </section>;
}
