'use client';

import React, { useState } from 'react';
import { submitLead } from '../../../lib/api';

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export const ContactForm: React.FC = () => {
  const [values, setValues] = useState<FormValues>({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormValues, boolean>>({
    fullName: false,
    email: false,
    phone: false,
    message: false,
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validateField = (name: keyof FormValues, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Please enter your full name.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Please enter your email address.';
        // Standard accessible email regex
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
          return 'Please enter a valid email address.';
        }
        return undefined;

      case 'phone': {
        if (!value.trim()) return 'Please enter your phone number.';
        // International phone format: permits +, digits, spaces, hyphens, parentheses (7 to 18 digits)
        const digits = value.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 18) {
          return 'Please enter a valid phone number (minimum 7 digits).';
        }
        return undefined;
      }

      case 'message':
        if (!value.trim()) return 'Please enter your message.';
        if (value.trim().length < 5) return 'Message must be at least 5 characters.';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof FormValues;
    setValues((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof FormValues;
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all as touched
    const allTouched: Record<keyof FormValues, boolean> = {
      fullName: true,
      email: true,
      phone: true,
      message: true,
    };
    setTouched(allTouched);

    // Validate all
    const newErrors: FormErrors = {};
    (Object.keys(values) as Array<keyof FormValues>).forEach((field) => {
      const err = validateField(field, values[field]);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Focus first error field for accessibility
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(`contact-${firstErrorField === 'fullName' ? 'full-name' : firstErrorField}`);
      if (el) el.focus();
      return;
    }

    // Begin Submission
    setStatus('submitting');

    try {
      await submitLead(values);

      // Successfully processed by backend
      setStatus('success');
      setValues({ fullName: '', email: '', phone: '', message: '' });
      setTouched({ fullName: false, email: false, phone: false, message: false });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="wk-contact__card">
      {status === 'success' ? (
        <div className="wk-contact__success-banner" role="status" aria-live="polite">
          <div className="wk-contact__success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="wk-contact__success-title">Message Sent Successfully!</h3>
          <p className="wk-contact__success-text">
            Thank you for reaching out. A Webkorps technical expert will review your requirements and respond within 24 hours.
          </p>
          <button
            type="button"
            className="wk-contact__reset-btn"
            onClick={() => setStatus('idle')}
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form
          className="wk-contact__form"
          noValidate
          onSubmit={handleSubmit}
          aria-label="Contact and consultation inquiry form"
        >
          {/* Full Name */}
          <div className={`wk-contact__field ${errors.fullName && touched.fullName ? 'wk-contact__field--error' : ''}`}>
            <label htmlFor="contact-full-name" className="wk-contact__label">
              Full Name <span className="wk-contact__required" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-full-name"
              name="fullName"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.fullName && touched.fullName)}
              aria-describedby={errors.fullName && touched.fullName ? 'contact-full-name-error' : undefined}
              autoComplete="name"
              placeholder="Enter Full Name"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className="wk-contact__input"
            />
            {errors.fullName && touched.fullName && (
              <span id="contact-full-name-error" className="wk-contact__error-msg" role="alert">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className={`wk-contact__field ${errors.email && touched.email ? 'wk-contact__field--error' : ''}`}>
            <label htmlFor="contact-email" className="wk-contact__label">
              Email Address <span className="wk-contact__required" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email && touched.email)}
              aria-describedby={errors.email && touched.email ? 'contact-email-error' : undefined}
              autoComplete="email"
              placeholder="Enter Email Address"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className="wk-contact__input"
            />
            {errors.email && touched.email && (
              <span id="contact-email-error" className="wk-contact__error-msg" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Phone Number */}
          <div className={`wk-contact__field ${errors.phone && touched.phone ? 'wk-contact__field--error' : ''}`}>
            <label htmlFor="contact-phone" className="wk-contact__label">
              Phone Number <span className="wk-contact__required" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.phone && touched.phone)}
              aria-describedby={errors.phone && touched.phone ? 'contact-phone-error' : undefined}
              autoComplete="tel"
              placeholder="Enter Phone Number"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className="wk-contact__input"
            />
            {errors.phone && touched.phone && (
              <span id="contact-phone-error" className="wk-contact__error-msg" role="alert">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Message */}
          <div className={`wk-contact__field ${errors.message && touched.message ? 'wk-contact__field--error' : ''}`}>
            <label htmlFor="contact-message" className="wk-contact__label">
              Message <span className="wk-contact__required" aria-hidden="true">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.message && touched.message)}
              aria-describedby={errors.message && touched.message ? 'contact-message-error' : undefined}
              placeholder="Write Your Message Here"
              rows={4}
              value={values.message}
              onChange={handleChange}
              onBlur={handleBlur}
              className="wk-contact__textarea"
            />
            {errors.message && touched.message && (
              <span id="contact-message-error" className="wk-contact__error-msg" role="alert">
                {errors.message}
              </span>
            )}
          </div>

          {/* General submission error */}
          {status === 'error' && (
            <div className="wk-contact__alert-error" role="alert">
              An unexpected error occurred. Please try again or contact us directly.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className={`wk-contact__submit-btn ${status === 'submitting' ? 'wk-contact__submit-btn--loading' : ''}`}
            aria-label="Send Message to Webkorps"
          >
            {status === 'submitting' ? (
              <>
                <span className="wk-contact__spinner" aria-hidden="true" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <svg
                  className="wk-contact__btn-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
