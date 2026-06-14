"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles } from "@/app/fonts";

function TermsOfServicePageContent() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <h1 className={`${displayStyles.sm} text-text-primary mb-4`}>Terms of Service</h1>
        <p className={`${bodyStyles.md} text-text-muted mb-8`}>Last updated: December 29, 2024</p>

        <div className="space-y-8">
          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>1. Acceptance of Terms</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              By accessing and using SFU Course Planner ("the Service"), you accept and agree to be bound by these Terms
              of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>2. Description of Service</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              SFU Course Planner is a course planning and information tool that provides:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Access to publicly available SFU course information</li>
              <li>Real-time enrollment and availability data</li>
              <li>Historical grade distributions and statistics</li>
              <li>Course comparison and analysis tools</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>3. Acceptable Use</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not
              to:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) to access the Service excessively</li>
              <li>Reproduce, duplicate, copy, or resell any part of the Service without permission</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>4. Data Accuracy and Availability</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              While we strive to provide accurate and up-to-date information:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Course data is sourced from third-party systems and may contain errors or delays</li>
              <li>We do not guarantee the accuracy, completeness, or timeliness of any information</li>
              <li>Always verify critical information directly with SFU official sources</li>
              <li>The Service may be unavailable due to maintenance or technical issues</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>5. Disclaimers</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL
              WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Warranties of merchantability and fitness for a particular purpose</li>
              <li>Warranties of accuracy, reliability, or non-infringement</li>
              <li>Warranties that the Service will be uninterrupted or error-free</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>6. Limitation of Liability</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>Loss of profits, data, or opportunities</li>
              <li>Academic consequences from inaccurate information</li>
              <li>Inability to register for courses</li>
              <li>Any other damages arising from your use of the Service</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>7. Intellectual Property</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              The Service and its original content (excluding third-party data) are owned by SFU Course Planner and are
              protected by copyright and other intellectual property laws.
            </p>
            <p className={`${bodyStyles.md} text-text-muted`}>
              Course data displayed in the Service belongs to Simon Fraser University and is used under fair use for
              educational and informational purposes.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>8. Third-Party Links and Data</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              The Service contains links to and data from third-party websites and services, including:
            </p>
            <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2 ml-4`}>
              <li>SFU CourseSys</li>
              <li>CourseDiggers</li>
              <li>SFU Course Outlines</li>
            </ul>
            <p className={`${bodyStyles.md} text-text-muted mt-4`}>
              We have no control over and assume no responsibility for the content, privacy policies, or practices of
              these third-party sites.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>9. Modifications to Service</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time
              without notice. We shall not be liable to you or any third party for any modification, suspension, or
              discontinuance of the Service.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>10. Changes to Terms</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              We may update these Terms of Service from time to time. We will notify you of any material changes by
              posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service
              after any changes constitutes acceptance of the new Terms.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>11. Governing Law</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              These Terms shall be governed by and construed in accordance with the laws of British Columbia, Canada,
              without regard to its conflict of law provisions.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>12. Contact Information</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              If you have any questions about these Terms of Service, please contact us through the{" "}
              <a href="/about" className="text-accent hover:underline">
                About page
              </a>
              .
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-accent">
            <h2 className={`${headerStyles.md} text-text-primary mb-3`}>Important Disclaimer</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-4`}>
              <strong>
                SFU Course Planner is an independent application and is not officially affiliated with, endorsed by, or
                connected to Simon Fraser University.
              </strong>
            </p>
            <p className={`${bodyStyles.md} text-text-muted`}>
              For official course registration, academic advising, and enrollment decisions, please consult SFU's
              official systems and academic advisors. This tool is provided for informational purposes only.
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default function TermsOfServicePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TermsOfServicePageContent />
    </Suspense>
  );
}
