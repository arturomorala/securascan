import { Link } from "wouter";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using SecuraScan ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on SecuraScan for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on SecuraScan</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>Attempt to gain unauthorized access to any portion or feature of the Service</li>
              <li>Use the Service to scan websites without authorization from the owner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
            <p>The materials on SecuraScan are provided on an 'as is' basis. SecuraScan makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
            <p>In no event shall SecuraScan or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SecuraScan, even if SecuraScan or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Accuracy of Materials</h2>
            <p>The materials appearing on SecuraScan could include technical, typographical, or photographic errors. SecuraScan does not warrant that any of the materials on its website are accurate, complete, or current. SecuraScan may make changes to the materials contained on its website at any time without notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Links</h2>
            <p>SecuraScan has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by SecuraScan of the site. Use of any such linked website is at the user's own risk.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Modifications</h2>
            <p>SecuraScan may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
            <p>These terms and conditions are governed by and construed in accordance with the laws of Spain, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. User Responsibilities</h2>
            <p>You agree that you will only use SecuraScan for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the website. Prohibited behavior includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harassing or causing distress or inconvenience to any person</li>
              <li>Obscene or offensive language or content</li>
              <li>Disrupting the normal flow of dialogue within the website</li>
              <li>Attempting to gain unauthorized access to systems or networks</li>
              <li>Scanning websites without authorization from the owner</li>
              <li>Using the Service for illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Authorization for Scanning</h2>
            <p>You represent and warrant that you have the legal right to authorize SecuraScan to scan any website you submit for analysis. You confirm that you are either the owner of the website or have explicit written permission from the owner to perform security analysis on it. Unauthorized scanning of websites you do not own or have permission to scan is prohibited and may violate applicable laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Limitation of Liability</h2>
            <p>SecuraScan's liability is limited to the amount paid by you for the Service in the past 12 months. In no case shall SecuraScan be liable for any indirect, incidental, special, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <div className="mt-3 p-4 bg-card border border-border/50 rounded-lg">
              <p><strong>Email:</strong> legal@securascan.com</p>
              <p><strong>Website:</strong> securascan.manus.space</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
