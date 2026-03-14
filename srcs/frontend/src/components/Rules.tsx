import '../App.css'
import React, {type  CSSProperties } from 'react';

export const PrivacyPolicy: React.FC = () => {
  const lastUpdated: string = "March 13, 2026";

  const styles: Record<string, CSSProperties> = {
    container: {
      maxWidth: '800px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-md)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6',
      textAlign: 'left',
      border: '1px solid var(--border-color)',
    },
    header: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: 'var(--primary-color)',
      borderBottom: '2px solid var(--border-color)',
      paddingBottom: '10px'
    },
    subHeader: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginTop: '25px',
      marginBottom: '10px',
      color: 'var(--secondary-color)'
    },
    textSmall: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginBottom: '20px'
    },
    infoBox: {
      backgroundColor: 'var(--bg-surface-alt)',
      borderLeft: '4px solid var(--primary-color)',
      padding: '15px',
      margin: '20px 0',
      borderRadius: '4px',
      color: 'var(--text-primary)'
    },
    warningBox: {
      color: 'var(--accent-danger)',
      fontWeight: '500',
      marginTop: '20px',
      padding: '15px',
      border: '1px solid var(--accent-danger)',
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 71, 87, 0.05)', // Slight tint of danger color
    },
    list: {
      marginLeft: '20px',
      marginBottom: '15px',
      listStyleType: 'disc',
      color: 'var(--text-primary)'
    },
    footer: {
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid var(--border-color)',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: 'var(--text-secondary)'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Privacy Policy: GameHub</h1>
      <p style={styles.textSmall}>Last Updated: {lastUpdated}</p>

      <section>
        <h2 style={styles.subHeader}>1. Data Collection & Purpose</h2>
        <p>We collect minimal data to facilitate your experience on the GameHub project:</p>
        <ul style={styles.list}>
          <li><strong>Identity:</strong> Username, Profile Picture, and Real Name (for verification).</li>
          <li><strong>Security:</strong> Custom Password (encrypted via <strong>bcrypt</strong>).</li>
          <li><strong>Dashboard Metrics:</strong> Online presence, win rates, and game participation.</li>
        </ul>
      </section>

      <section>
        <h2 style={styles.subHeader}>2. Storage & Security</h2>
        <div style={styles.infoBox}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Internal Hosting:</strong> Data is stored on a <strong>local Virtual Machine (VM)</strong> and is not shared with third-party cloud services.
          </p>
        </div>
        <div style={styles.warningBox}>
          <strong>⚠️ Security Disclaimer:</strong> This platform does not implement Two-Factor Authentication (2FA). We recommend using a password unique to this project.
        </div>
      </section>

      <section>
        <h2 style={styles.subHeader}>3. Analytics</h2>
        <p>
          Your gameplay statistics are processed internally to populate your user dashboard. This data is only visible to you and project administrators.
        </p>
      </section>

      <section>
        <h2 style={styles.subHeader}>4. Account Management</h2>
        <p>
          Account deletion is not currently automated. Please contact the project team for manual data removal. All data will be wiped at the end of the academic term.
        </p>
      </section>

      <footer style={styles.footer}>
        <p>© 2026 GameHub Team - Built for [Course Name/School]</p>
      </footer>
    </div>
  );
};

export const TermsOfService: React.FC = () => {
  const styles: Record<string, CSSProperties> = {
    container: {
      maxWidth: '800px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-md)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6',
      textAlign: 'left',
      border: '1px solid var(--border-color)',
    },
    header: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: 'var(--primary-color)',
      borderBottom: '2px solid var(--border-color)',
      paddingBottom: '10px'
    },
    subHeader: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginTop: '20px',
      marginBottom: '8px',
      color: 'var(--secondary-color)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    sectionText: {
      fontSize: '0.95rem',
      color: 'var(--text-primary)',
      marginBottom: '15px'
    },
    accentText: {
      color: 'var(--primary-color)',
      fontWeight: 'bold'
    },
    footer: {
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '1px solid var(--border-color)',
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      fontStyle: 'italic'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Terms of Service</h1>
      <p style={styles.sectionText}>
        By accessing <strong>GameHub</strong>, you agree to be bound by the following terms. This is a school project; 
        by creating an account, you acknowledge the academic nature of this platform.
      </p>

      <h2 style={styles.subHeader}>1. User Conduct & Fair Play</h2>
      <p style={styles.sectionText}>
        To maintain a competitive and enjoyable environment, all users agree to:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
        <li>Refrain from using exploits, cheats, or third-party software to gain an unfair advantage.</li>
        <li>Respect other players. Harassment, hate speech, or toxic behavior will not be tolerated.</li>
        <li>Maintain the integrity of the dashboard metrics; do not attempt to manipulate win rates or session data.</li>
      </ul>

      <h2 style={styles.subHeader}>2. Account Responsibilities</h2>
      <p style={styles.sectionText}>
        You are responsible for the security of your account credentials. Because <span style={styles.accentText}>2FA is not implemented</span>, 
        you agree to use a unique password for this service. You are liable for all activity that occurs under your username.
      </p>

      <h2 style={styles.subHeader}>3. Data & Matchmaking</h2>
      <p style={styles.sectionText}>
        You grant GameHub permission to store and process your gameplay data, including win/loss ratios and active status, 
        for the purpose of matchmaking, dashboard visualization, and improving the overall user experience.
      </p>

      <h2 style={styles.subHeader}>4. Termination of Access</h2>
      <p style={styles.sectionText}>
        We reserve the right to suspend or terminate accounts that violate these terms, specifically regarding 
        cheating or behavior that negatively impacts the school project environment.
      </p>

      <h2 style={styles.subHeader}>5. "As-Is" Disclaimer</h2>
      <p style={styles.sectionText}>
        This service is provided "as-is" for educational purposes. We do not guarantee 100% uptime or the 
        permanent storage of game data.
      </p>

      <div style={styles.footer}>
        Acceptance of these terms is required for account creation.
      </div>
    </div>
  );
};