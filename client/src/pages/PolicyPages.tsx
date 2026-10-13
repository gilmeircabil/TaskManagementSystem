import { Link } from 'react-router-dom';
import { IconCheck } from '../components/Icons';

function PolicyShell({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="page" style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <span className="logo-mark">
            <IconCheck size={16} strokeWidth={3} />
          </span>
          TaskFlow
        </Link>
        <Link to="/" className="btn btn-secondary btn-sm">
          ← Back to App
        </Link>
      </div>

      <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>{title}</h1>
          <p className="muted small">Last updated: {lastUpdated}</p>
        </div>
        <div className="policy-content" style={{ lineHeight: 1.7, fontSize: '0.9375rem', color: '#334155' }}>
          {children}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <Link to="/" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyShell title="Privacy Policy" lastUpdated="October 13, 2026">
      <h3 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>1. Who We Are</h3>
      <p>
        TaskFlow ("we", "us", "our") provides an online task and productivity management system. We are committed
        to protecting your personal privacy in accordance with GDPR, CCPA, and applicable data privacy laws.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>2. What Data We Collect</h3>
      <p>We collect only the minimum information necessary to provide and operate the service:</p>
      <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
        <li><strong>Account Information:</strong> Name, email address, and a securely hashed password.</li>
        <li><strong>User Content:</strong> Tasks, task titles, descriptions, due dates, projects, and categories you create.</li>
        <li><strong>Session Information:</strong> Strictly necessary HTTP-only session cookies used to authenticate your browser.</li>
      </ul>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>3. Why We Use It & Legal Basis</h3>
      <p>
        We process your data strictly to perform our contract with you (providing task management functionality,
        maintaining account security, and displaying your deadlines and notifications). We do not sell, rent, or share your
        personal data with advertisers or data brokers.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>4. Third-Party Service Providers</h3>
      <p>
        Your data is hosted in secured cloud database infrastructure provided by MongoDB Atlas. All transmissions
        are encrypted in transit via Transport Layer Security (TLS/HTTPS).
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>5. Data Retention & Your Rights</h3>
      <p>
        Your data is stored for as long as your account remains active. Under GDPR and privacy regulations, you have
        the right to access your personal data, request corrections, or request immediate and complete deletion (Right to Erasure).
        You can permanently delete your account and all associated data at any time directly through your account menu.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>6. Contact Us</h3>
      <p>For privacy inquiries or questions regarding your personal information, contact support@taskflow.local.</p>
    </PolicyShell>
  );
}

export function TermsOfServicePage() {
  return (
    <PolicyShell title="Terms of Service" lastUpdated="October 13, 2026">
      <h3 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>1. Acceptance of Terms</h3>
      <p>
        By registering for or using TaskFlow, you agree to be bound by these Terms of Service. If you do not agree
        with any part of these terms, please do not use the application.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>2. Account Responsibilities</h3>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and password. You agree to
        notify us immediately if you suspect unauthorized access to your account.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>3. Acceptable Use</h3>
      <p>
        You agree to use TaskFlow solely for lawful purposes. You agree not to attempt to compromise application security,
        reverse-engineer backend APIs, bypass rate limiters, or introduce malicious code.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>4. Service Availability & Changes</h3>
      <p>
        We strive for high reliability and uptime, but provide the service on an "as-is" and "as-available" basis.
        We reserve the right to improve, update, or discontinue features with reasonable notice.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>5. Termination</h3>
      <p>
        You may terminate your account at any time. Upon termination, all stored tasks, projects, and account records
        are permanently deleted from our primary databases.
      </p>
    </PolicyShell>
  );
}

export function CookiePolicyPage() {
  return (
    <PolicyShell title="Cookie Policy" lastUpdated="October 13, 2026">
      <h3 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>What Are Cookies?</h3>
      <p>
        Cookies are small text files stored on your computer or mobile device by your web browser to preserve session state.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>Cookies Used by TaskFlow</h3>
      <p>
        TaskFlow uses <strong>strictly necessary</strong> cookies only. We do not use third-party tracking, advertising,
        or analytics cookies.
      </p>
      <table className="task-table" style={{ marginTop: '1rem', background: '#fff' }}>
        <thead>
          <tr>
            <th>Cookie Name</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>tms_token</code></td>
            <td>Strictly Necessary</td>
            <td>Cryptographically signed HTTP-only JWT maintaining your authenticated session.</td>
            <td>7 days</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>Managing Cookies</h3>
      <p>
        Because our cookie is strictly necessary to authenticate your access to your private tasks, disabling it in
        browser settings will prevent you from logging in.
      </p>
    </PolicyShell>
  );
}

export function AccessibilityStatementPage() {
  return (
    <PolicyShell title="Accessibility Statement" lastUpdated="October 13, 2026">
      <h3 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Our Commitment</h3>
      <p>
        TaskFlow is committed to digital accessibility and making our task management interface usable for all individuals,
        including users with disabilities, by conforming to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
      </p>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>Measures Taken</h3>
      <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
        <li>Full keyboard accessibility for all actions (navigation, dialogs, dropdowns, form controls).</li>
        <li>Skip to main content keyboard shortcut.</li>
        <li>Accessible contrast ratios across dark text, light backgrounds, and status badges.</li>
        <li>Dual-mode indicators (text + color) ensuring no information is conveyed by color alone.</li>
        <li>Screen-reader-friendly dialogs, ARIA roles, and accessible labels on all form inputs.</li>
      </ul>

      <h3 style={{ marginTop: '1.25rem', color: 'var(--text-main)' }}>Feedback</h3>
      <p>
        If you experience any accessibility barriers while using TaskFlow, please contact accessibility@taskflow.local.
      </p>
    </PolicyShell>
  );
}
