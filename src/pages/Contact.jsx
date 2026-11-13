import { useState } from "react";
import {
  ArrowUpRight,
  EnvelopeSimple,
  InstagramLogo,
  PaperPlaneTilt,
  WhatsappLogo,
} from "@phosphor-icons/react";
import Reveal from "../components/Reveal";
import { contact } from "../data/content";
import { usePageMeta } from "../hooks/usePageMeta";
import { hasWhatsApp, site, whatsappUrl } from "../config";
import { buildContactMessage } from "../lib/order";

const initialFields = { name: "", email: "", message: "" };

export default function Contact() {
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ kind: "", message: "" });

  usePageMeta({
    title: "Contact",
    description:
      "Ask the Taaking Goods studio about a custom resin piece, gifting, or an order. Write by email or message on WhatsApp.",
    path: "/contact",
  });

  const update = (key, value) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (fields.name.trim().length < 2) next.name = "Please add your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = "Add a valid email address.";
    }
    if (fields.message.trim().length < 10) {
      next.message = "Tell us a little more, at least 10 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setStatus({ kind: "", message: "" });

    if (!validate()) {
      setStatus({ kind: "error", message: "Check the highlighted fields and try again." });
      return;
    }

    const message = buildContactMessage(fields);

    if (hasWhatsApp()) {
      const opened = window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
      if (!opened) {
        setStatus({
          kind: "error",
          message: "Your browser blocked the WhatsApp window. You can email us instead.",
        });
        return;
      }
      setStatus({
        kind: "ok",
        message: "WhatsApp opened with your message. Send it there and we will reply.",
      });
      return;
    }

    const subject = encodeURIComponent(`Studio enquiry from ${fields.name.trim()}`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${encodeURIComponent(message)}`;
    setStatus({
      kind: "info",
      message: "Your email app is opening with the message. If nothing happens, write to us directly.",
    });
  };

  return (
    <section className="contact-page">
      <div className="container">
        <div className="contact-hero">
          <p className="eyebrow">Say hello</p>
          <div className="contact-hero__grid">
            <h1 className="heading-1 page-title">
              {contact.heading[0]}
              <br />
              {contact.heading[1]}
            </h1>
            <p className="body-2 contact-hero__intro">{contact.intro}</p>
          </div>
        </div>

        <div className="contact-grid">
          <Reveal className="contact-aside">
            <div className="contact-channels">
              <a className="contact-channel" href={`mailto:${site.email}`}>
                <span className="contact-channel__icon" aria-hidden="true">
                  <EnvelopeSimple size={20} weight="light" />
                </span>
                <span className="contact-channel__body">
                  <span className="caption-4 contact-channel__label">Email</span>
                  <span className="title-3">{site.email}</span>
                  <span className="caption-2">For commissions, stockists, and everything else.</span>
                </span>
                <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
              </a>

              {hasWhatsApp() && (
                <a
                  className="contact-channel"
                  href={whatsappUrl("Hello Taaking Goods, I have a question.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="contact-channel__icon" aria-hidden="true">
                    <WhatsappLogo size={20} weight="light" />
                  </span>
                  <span className="contact-channel__body">
                    <span className="caption-4 contact-channel__label">WhatsApp</span>
                    <span className="title-3">Message the studio</span>
                    <span className="caption-2">Order updates and quick questions.</span>
                  </span>
                  <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
                </a>
              )}

              {site.instagram && (
                <a
                  className="contact-channel"
                  href={site.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="contact-channel__icon" aria-hidden="true">
                    <InstagramLogo size={20} weight="light" />
                  </span>
                  <span className="contact-channel__body">
                    <span className="caption-4 contact-channel__label">Instagram</span>
                    <span className="title-3">See what is curing</span>
                    <span className="caption-2">New pours leave the studio here first.</span>
                  </span>
                  <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="contact-note">
              <p className="eyebrow">For a custom piece</p>
              <p className="body-3">
                Include the size, colour, quantity, and the date you need it by. A reference
                image helps too. We will reply with what is possible, and what it will cost.
              </p>
            </div>

            {!hasWhatsApp() && (
              <p className="caption-2 contact-note__small">
                WhatsApp ordering is being connected. Email reaches the studio today.
              </p>
            )}
          </Reveal>

          <Reveal delay={100} className="contact-form-wrap">
            <form className="contact-form" onSubmit={onSubmit} noValidate>
              <div className="contact-form__head">
                <h2 className="heading-4">Send a note.</h2>
                <p className="caption-2">
                  {hasWhatsApp()
                    ? "This opens WhatsApp with your message ready to send."
                    : "This opens your email app with the message ready to send."}
                </p>
              </div>

              <div className={`field${errors.name ? " field--error" : ""}`}>
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={fields.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="field-error" id="contact-name-error">{errors.name}</p>
                )}
              </div>

              <div className={`field${errors.email ? " field--error" : ""}`}>
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={(event) => update("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="field-error" id="contact-email-error">{errors.email}</p>
                )}
              </div>

              <div className={`field${errors.message ? " field--error" : ""}`}>
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  value={fields.message}
                  onChange={(event) => update("message", event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  placeholder="A colour, a size, a date, or just a question."
                />
                {errors.message && (
                  <p className="field-error" id="contact-message-error">{errors.message}</p>
                )}
              </div>

              <button type="submit" className="btn btn--primary contact-submit">
                <PaperPlaneTilt size={17} weight="regular" aria-hidden="true" />
                {hasWhatsApp() ? "Send on WhatsApp" : "Send by email"}
              </button>

              {status.message && (
                <p
                  className={`contact-status contact-status--${status.kind}`}
                  role={status.kind === "error" ? "alert" : "status"}
                >
                  {status.message}
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
