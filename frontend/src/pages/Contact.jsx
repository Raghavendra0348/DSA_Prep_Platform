import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail, MessageSquare, Send, CheckCircle2,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { sendContactMessage } from '../api/contact';
import './Contact.css';

function GithubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const FAQ_ITEMS = [
  {
    question: 'Is DSA Prep completely free to use?',
    answer: 'Yes, 100% free! All 429+ target companies, 3,392+ LeetCode questions, frequency breakdowns, and topic collections are freely available without any subscription or paywall.',
  },
  {
    question: 'How often is the company interview question data updated?',
    answer: 'We continuously refresh our database by aggregating real interview experiences and candidate submissions across 6-month, 1-year, and 2-year periods to ensure high relevance for 2026 tech hiring.',
  },
  {
    question: 'Can I suggest or request questions for a new company?',
    answer: 'Absolutely! Select "Suggest a New Company" in the contact form below or open an issue on our GitHub repository with the company details and problem links.',
  },
  {
    question: 'How do the Employer Tiers work?',
    answer: 'We group companies into 4 strategic tiers: Tier 1 (MAANG+ tech giants), Tier 2 (Product Unicorns), Tier 3 (Fintech & High-Growth Startups), and Tier 4 (Global IT & Service Consulting) to help you tailor your prep strategy.',
  },
  {
    question: 'Where can I report a bug or incorrect problem tag?',
    answer: 'Select "Bug Report / Correction" in the form below, provide the question title or URL, and our maintainers will verify and update the database within 24 hours.',
  },
];

export default function Contact() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    category: searchParams.get('type') === 'suggestion' ? 'suggestion' : (searchParams.get('type') === 'bug' ? 'bug' : 'general'),
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    document.title = 'Contact & Support — DSA Prep Platform';
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast?.error?.('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await sendContactMessage(form);
      setSubmitting(false);
      setSubmitted(true);
      toast?.success?.('Your message has been sent successfully!');
    } catch (err) {
      setSubmitting(false);
      toast?.error?.(err.message || 'Failed to send message. Please try again.');
    }
  };

  const toggleFaq = (index) => {
    setExpandedFaq(prev => (prev === index ? null : index));
  };

  return (
    <div className="contact-page">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="contact-hero">
        <div className="container contact-hero-content">
          <div className="contact-badge">
            <Mail size={14} />
            <span>SUPPORT & COMMUNITY</span>
          </div>
          <h1 className="contact-title">We&#39;re Here to Help Your Prep</h1>
          <p className="contact-subtitle">
            Have a question, feedback on a problem tag, or want to request a new target company? Reach out to the DSA Prep team.
          </p>
        </div>
      </section>

      {/* ── Main Contact Grid ──────────────────────────────────────────────── */}
      <div className="container contact-main-wrap">
        
        {/* Contact Form Card */}
        <div className="contact-form-card">
          <h2>Send Us a Message</h2>
          <p className="form-subtitle">We typically reply within 24 hours on business days.</p>

          {submitted ? (
            <div className="contact-success-box">
              <div className="success-icon-wrap">
                <CheckCircle2 size={32} />
              </div>
              <h3>Message Received!</h3>
              <p>
                Thank you for reaching out, <strong>{form.name}</strong>. Our team has received your message regarding <em>{form.subject || 'your inquiry'}</em> and will get back to you at <strong>{form.email}</strong> shortly.
              </p>
              <button
                type="button"
                className="btn-send-another"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', category: 'general', subject: '', message: '' });
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-name">Your Name <span className="req">*</span></label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    className="input-field"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-email">Email Address <span className="req">*</span></label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    className="input-field"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-category">Inquiry Category</label>
                  <select
                    id="contact-category"
                    name="category"
                    className="select-field"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="general">General Question</option>
                    <option value="suggestion">Suggest a New Company / Questions</option>
                    <option value="bug">Report an Issue / Correction</option>
                    <option value="partnership">Partnership & Contribution</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-subject">Subject</label>
                  <input
                    type="text"
                    id="contact-subject"
                    name="subject"
                    className="input-field"
                    placeholder="e.g. Add questions for Palantir"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact-message">Message <span className="req">*</span></label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="textarea-field"
                  rows={5}
                  placeholder="Describe your question, feedback, or suggestion in detail..."
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-submit-contact"
                disabled={submitting}
              >
                {submitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send size={15} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Channels & Info Sidebar */}
        <aside className="contact-sidebar">
          
          <div className="channel-card">
            <div className="channel-icon-wrap icon-mail">
              <Mail size={20} />
            </div>
            <div className="channel-body">
              <h4>Direct Email</h4>
              <p>For official inquiries, suggestions, and feedback.</p>
              <a href="mailto:support@dsaprep.dev" className="channel-link">
                support@dsaprep.dev →
              </a>
            </div>
          </div>

          <div className="channel-card">
            <div className="channel-icon-wrap icon-github">
              <GithubIcon size={20} />
            </div>
            <div className="channel-body">
              <h4>GitHub Repository</h4>
              <p>Submit bug reports, propose dataset additions, and collaborate.</p>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-link"
              >
                Open GitHub Issues →
              </a>
            </div>
          </div>

          <div className="channel-card">
            <div className="channel-icon-wrap icon-discord">
              <MessageSquare size={20} />
            </div>
            <div className="channel-body">
              <h4>Community Discord</h4>
              <p>Discuss interview questions and strategies with fellow engineers.</p>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-link"
              >
                Join Community Server →
              </a>
            </div>
          </div>

        </aside>

      </div>

      {/* ── FAQ Section ────────────────────────────────────────────────────── */}
      <section className="contact-faq-section">
        <div className="container">
          <div className="faq-header">
            <span className="faq-tag">FREQUENTLY ASKED QUESTIONS</span>
            <h2>Common Inquiries</h2>
            <p>Quick answers to common questions about DSA Prep.</p>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-item ${isOpen ? 'faq-open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
