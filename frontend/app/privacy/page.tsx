"use client";

/* Legal copy intentionally preserves its original punctuation and wording. */
/* eslint-disable react/no-unescaped-entities */

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { headerStyles, bodyStyles } from "@/app/fonts";

export default function PrivacyPage() {
  return (
    <PageContainer>
      <div className="max-w-[70ch]">
        <PageHeader title="Privacy Policy" description="Last updated: December 29, 2024" />

        <div>
          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Introduction</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              SFU Course Planner ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when you use our course planning application.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Information We Collect</h2>

            <h3 className={`${headerStyles.md} text-text-primary mb-3 mt-4`}>Public Course Data</h3>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              We aggregate and display publicly available course information from:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>SFU's CourseSys API (enrollment data, course offerings, sections)</li>
              <li>CourseDiggers (grade distributions and historical statistics)</li>
              <li>SFU's public course catalog</li>
            </ul>

            <h3 className={`${headerStyles.md} text-text-primary mb-3 mt-6`}>Usage Data</h3>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              We may collect basic usage analytics to improve our service, including:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Pages visited and features used</li>
              <li>Browser type and device information</li>
              <li>Approximate location (city/country level only)</li>
            </ul>

            <h3 className={`${headerStyles.md} text-text-primary mb-3 mt-6`}>Cookies and Local Storage</h3>
            <p className={`${bodyStyles.md} text-text-muted`}>
              We use browser local storage to save your theme preferences (light/dark mode). No tracking cookies are
              used.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>How We Use Your Information</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>We use the information we collect to:</p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Provide accurate and up-to-date course information</li>
              <li>Display enrollment trends and grade distributions</li>
              <li>Improve application performance and user experience</li>
              <li>Maintain and troubleshoot the service</li>
            </ul>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Data Sharing</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              We do not sell, trade, or otherwise transfer your information to third parties. Course data displayed in
              our application is sourced from publicly available SFU systems.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Third-Party Services</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              Our application uses the following third-party services:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li><strong>Vercel:</strong> Hosting and deployment infrastructure</li>
              <li><strong>AWS Elastic Beanstalk:</strong> Backend API hosting</li>
              <li><strong>Supabase:</strong> Database storage</li>
              <li><strong>Cloudflare:</strong> DNS and HTTPS proxy</li>
            </ul>
            <p className={`${bodyStyles.md} text-text-muted mt-4`}>
              These services have their own privacy policies governing their collection and use of your information.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Data Security</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              We implement appropriate security measures to protect against unauthorized access, alteration, disclosure,
              or destruction of data. All data transmission is encrypted using HTTPS.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Your Rights</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>You have the right to:</p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Access information we hold about you</li>
              <li>Request correction or deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Clear your browser's local storage at any time</li>
            </ul>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Children's Privacy</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              Our service is intended for use by university students and adults. We do not knowingly collect information
              from individuals under 13 years of age.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Changes to This Privacy Policy</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              We may update this Privacy Policy from time to time. We will notify users of any material changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>Contact Us</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              If you have questions about this Privacy Policy, please contact us through the{" "}
              <a href="/about" className="text-accent-text hover:underline">
                About page
              </a>
              .
            </p>
          </section>

          <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
            <h2 className={`${headerStyles.md} text-text-primary mb-3`}>Disclaimer</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              SFU Course Planner is an independent application and is not officially affiliated with, endorsed by, or
              connected to Simon Fraser University. All course data is sourced from publicly available SFU systems.
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
