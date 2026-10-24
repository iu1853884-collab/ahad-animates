"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { ContactFormData } from "@/types";

const PROJECT_TYPES = [
  "3D Product Visualization",
  "CGI Advertising",
  "3D Product Animation",
  "AI Ads & Hybrid Visuals",
  "Other Creative Inquiry",
];

export function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    projectType: "3D Product Visualization",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [website, setWebsite] = useState("");
  const submissionInProgress = useRef(false);

  const validate = (): boolean => {
    const errs: Partial<ContactFormData> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Please enter your name (at least 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (
      formData.subject.trim().length < 3 ||
      formData.subject.trim().length > 160 ||
      /[\r\n\u0000-\u001f\u007f]/.test(formData.subject)
    ) {
      errs.subject = "Please enter a subject between 3 and 160 characters.";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = "Please provide project details (at least 10 characters).";
    }
    if (formData.message.trim().length > 4000) {
      errs.message = "Project details must be 4000 characters or fewer.";
    }
    if (!PROJECT_TYPES.includes(formData.projectType)) {
      errs.projectType = "Please choose a valid project type.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionInProgress.current || !validate()) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, website }),
      });
      const result = (await response.json().catch(() => null)) as {
        sent?: boolean;
        message?: string;
      } | null;
      if (!response.ok || result?.sent !== true) {
        throw new Error(
          result?.message || "The inquiry was not accepted for delivery.",
        );
      }
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to send your inquiry. Please try again.",
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative px-6 py-28 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-violet-400 uppercase">
            HAVE A PROJECT IN MIND?
          </p>
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
            Let&apos;s Create
            <br />
            <span className="bg-gradient-to-r from-zinc-200 via-violet-300 to-zinc-500 bg-clip-text text-transparent">
              something unreal
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
            Have an idea that deserves to move? Send an inquiry below or reach
            out directly to collaborate on high-end 3D visuals.
          </p>
        </div>

        {/* Interactive Inquiry Form */}
        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-12 backdrop-blur-sm shadow-2xl">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="inquiry-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
                noValidate
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Name Input */}
                  <div>
                    <label
                      htmlFor="client-name"
                      className="mb-2 block text-xs font-semibold text-zinc-300"
                    >
                      Your name <span className="text-violet-400">*</span>
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      required
                      maxLength={100}
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? "client-name-error" : undefined
                      }
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your name"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-violet-400 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    {errors.name && (
                      <p
                        className="mt-1.5 text-xs text-rose-400"
                        id="client-name-error"
                        role="alert"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="client-email"
                      className="mb-2 block text-xs font-semibold text-zinc-300"
                    >
                      Email address <span className="text-violet-400">*</span>
                    </label>
                    <input
                      id="client-email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "client-email-error" : undefined
                      }
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-violet-400 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    {errors.email && (
                      <p
                        className="mt-1.5 text-xs text-rose-400"
                        id="client-email-error"
                        role="alert"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Project Type Dropdown */}
                <div>
                  <label
                    htmlFor="project-type"
                    className="mb-2 block text-xs font-semibold text-zinc-300"
                  >
                    Project type
                  </label>
                  <select
                    id="project-type"
                    aria-invalid={Boolean(errors.projectType)}
                    aria-describedby={
                      errors.projectType ? "project-type-error" : undefined
                    }
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({ ...formData, projectType: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#121218] px-4 py-3.5 text-sm text-white transition focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  >
                    {PROJECT_TYPES.map((projectType) => (
                      <option key={projectType} value={projectType}>
                        {projectType}
                      </option>
                    ))}
                  </select>
                  {errors.projectType && (
                    <p
                      className="mt-1.5 text-xs text-rose-400"
                      id="project-type-error"
                      role="alert"
                    >
                      {errors.projectType}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="client-subject"
                    className="mb-2 block text-xs font-semibold text-zinc-300"
                  >
                    Subject <span className="text-violet-400">*</span>
                  </label>
                  <input
                    id="client-subject"
                    type="text"
                    required
                    maxLength={160}
                    value={formData.subject}
                    onChange={(event) =>
                      setFormData({ ...formData, subject: event.target.value })
                    }
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={errors.subject ? "client-subject-error" : undefined}
                    placeholder="Briefly describe your project"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-violet-400 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                  {errors.subject && (
                    <p
                      className="mt-1.5 text-xs text-rose-400"
                      id="client-subject-error"
                      role="alert"
                    >
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message Input */}
                <div>
                  <label
                    htmlFor="client-message"
                    className="mb-2 block text-xs font-semibold text-zinc-300"
                  >
                    Project details <span className="text-violet-400">*</span>
                  </label>
                  <textarea
                    id="client-message"
                    rows={4}
                    required
                    maxLength={4000}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "client-message-error" : undefined
                    }
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Tell us about your product, desired timeline, deliverables, or brand vision..."
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-500 transition focus:border-violet-400 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                  {errors.message && (
                    <p
                      className="mt-1.5 text-xs text-rose-400"
                      id="client-message-error"
                      role="alert"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>

                <div
                  aria-hidden="true"
                  className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                >
                  <label htmlFor="company-website">Company website</label>
                  <input
                    id="company-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </div>

                {/* Submission notice */}
                <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-400">
                  <AlertCircle size={15} className="text-violet-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Privacy:</strong> Your inquiry is sent securely to
                    the studio by its email provider. Your message is not stored
                    by this website.
                  </p>
                </div>

                {submissionError && (
                  <p
                    className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-200"
                    role="alert"
                  >
                    {submissionError} You can also contact the studio directly
                    at{" "}
                    <a
                      className="underline underline-offset-2"
                      href="mailto:ahadanimates@gmail.com"
                    >
                      ahadanimates@gmail.com
                    </a>
                    .
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="aa-button aa-button-primary rounded-full px-7 py-3.5 text-xs tracking-wider"
                  >
                    <span>
                      {isSubmitting ? "Sending…" : "Send inquiry"}
                    </span>
                    <Send aria-hidden="true" size={14} />
                  </button>

                  <a
                    href="mailto:ahadanimates@gmail.com?subject=3D%20Project%20Inquiry%20-%20Ahad%20Animates"
                    className="text-xs text-zinc-400 hover:text-violet-300 transition-colors inline-flex items-center gap-1"
                  >
                    Skip form and email directly <ArrowRight size={12} />
                  </a>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="inquiry-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white">Inquiry accepted</h3>
                <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-300">
                  Your inquiry was accepted by the email provider for delivery.
                  This confirms provider acceptance, not inbox delivery.
                </p>

                <div className="mx-auto my-6 max-w-md rounded-xl border border-white/10 bg-black/40 p-4 text-left text-xs text-zinc-400 space-y-1">
                  <p>
                    <span className="text-zinc-500">Contact:</span>{" "}
                    {formData.email}
                  </p>
                  <p>
                    <span className="text-zinc-500">Type:</span>{" "}
                    {formData.projectType}
                  </p>
                  <p>
                    <span className="text-zinc-500">Subject:</span>{" "}
                    {formData.subject}
                  </p>
                  <p className="line-clamp-2">
                    <span className="text-zinc-500">Message:</span>{" "}
                    {formData.message}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setSubmissionError("");
                    }}
                    className="aa-button aa-button-secondary rounded-full px-6 py-3.5 text-xs tracking-wider"
                  >
                    Edit inquiry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Email fallback text */}
        <div className="mt-10 text-center text-xs text-zinc-400">
          <p className="mb-3 inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-violet-300" />
            Islamabad, Pakistan
          </p>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a
              href="https://ahadanimates.com/connect-with-me/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Connect with the studio <ExternalLink size={12} />
            </a>
            <a
              href="https://ahadanimates.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Contact page <ExternalLink size={12} />
            </a>
          </div>
          <span>Public studio email: </span>
          <a
            href="mailto:ahadanimates@gmail.com?subject=3D%20Project%20Inquiry%20-%20Ahad%20Animates"
            className="rounded font-mono text-zinc-200 underline underline-offset-4 transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            ahadanimates@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}
