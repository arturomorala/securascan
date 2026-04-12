import { Link } from "wouter";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm"><span className="gradient-text">Secura</span>Scan</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>SecuraScan ("we", "us", "our") operates the securascan.manus.space website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">2.1 Personal Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Email Address:</strong> Used for account creation, authentication, and communication</li>
              <li><strong>Name:</strong> Used to personalize your account and communications</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
              <li><strong>Website URLs:</strong> Scanned for security analysis as per your request</li>
              <li><strong>Scan Results:</strong> Stored to provide you with historical reports and analysis</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">2.2 Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP Address (for security and abuse prevention)</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Referrer information</li>
              <li>Device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Use of Data</h2>
            <p>SecuraScan uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues and fraud</li>
              <li>To send you promotional communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Security of Data</h2>
            <p>The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>All data transmission is encrypted using SSL/TLS</li>
              <li>Payment processing is PCI DSS compliant through Stripe</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Access to personal data is restricted to authorized personnel only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. GDPR Compliance (EU Users)</h2>
            <p>If you are located in the European Union, you have the following rights under GDPR:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> You can request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> You can correct inaccurate data</li>
              <li><strong>Right to Erasure:</strong> You can request deletion of your data (right to be forgotten)</li>
              <li><strong>Right to Restrict Processing:</strong> You can limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> You can receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> You can object to certain processing</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at: <strong>privacy@securascan.com</strong></p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
            <p>We use cookies to enhance your experience on our Service. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Session Cookies:</strong> Used for authentication and user session management</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our Service</li>
              <li><strong>Preference Cookies:</strong> Remember your language and theme preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
            <p>Our Service may contain links to other sites that are not operated by us. This Privacy Policy does not apply to third-party websites, and we are not responsible for their privacy practices.</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
              <li><strong>Manus Auth:</strong> Authentication service</li>
              <li><strong>Analytics:</strong> For understanding service usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
            <p>We will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations.</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Account data: Retained while your account is active, deleted upon request</li>
              <li>Scan results: Retained for 12 months or as per your subscription plan</li>
              <li>Payment records: Retained for 7 years (legal requirement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <div className="mt-3 p-4 bg-card border border-border/50 rounded-lg">
              <p><strong>Email:</strong> privacy@securascan.com</p>
              <p><strong>Website:</strong> securascan.manus.space</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
