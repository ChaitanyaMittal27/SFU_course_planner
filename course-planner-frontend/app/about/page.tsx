"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ChevronDown, BookOpen, TrendingUp, Eye, LayoutGrid, CheckCircle2, Loader2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import emailjs from "@emailjs/browser";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { displayStyles, bodyStyles, labelStyles, headerStyles } from "@/app/fonts";

const features = [
  { href: "/browse", icon: BookOpen, title: "Browse Courses", description: "Explore 500+ courses across 50+ departments with real-time enrollment data" },
  { href: "/graph", icon: TrendingUp, title: "Analyze Trends", description: "Visualize historical enrollment patterns and grade distributions" },
  { href: "/dashboard", icon: Eye, title: "Track Availability", description: "Monitor course sections and get notified when seats open up" },
  { href: "/compare", icon: LayoutGrid, title: "Compare Courses", description: "Compare courses and offerings side-by-side to make better decisions" },
];

const faqs = [
  {
    question: "How often is enrollment data updated?",
    answer: "Enrollment data is fetched in real-time from SFU's CourseSys whenever you view a course. Historical data shows the last 12 semesters (4 years) of offerings. The data is as current as what you'd see on CourseSys itself.",
  },
  {
    question: "Where does the grade distribution data come from?",
    answer: "Grade statistics (median grades, fail rates, distributions) come from CourseDiggers, which aggregates historical grade data from SFU. Note that this data represents overall course averages, not specific semester offerings. Not all courses have grade data available.",
  },
  {
    question: "Is this an official SFU website?",
    answer: "No, SFU Course Planner is an independent student project and is not affiliated with or endorsed by Simon Fraser University. All data is publicly available from SFU CourseSys and CourseDiggers.",
  },
  {
    question: "How do Watchers work?",
    answer: "Watchers let you monitor specific course sections for enrollment changes. Once authentication is enabled, you'll be able to track courses and receive notifications when seats become available. This feature is currently in development.",
  },
  {
    question: "Can I suggest new features or report bugs?",
    answer: "Absolutely! Use the contact form below or open an issue on GitHub. I'm always looking to improve the platform based on user feedback.",
  },
];

function AboutPageContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", reason: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");
    setFormError(null);

    if (!formData.name || formData.name.length < 2) {
      setFormError("Name must be at least 2 characters");
      setFormStatus("error");
      return;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError("Please enter a valid email address");
      setFormStatus("error");
      return;
    }
    if (!formData.reason) {
      setFormError("Please select a reason");
      setFormStatus("error");
      return;
    }
    if (!formData.message || formData.message.length < 10) {
      setFormError("Message must be at least 10 characters");
      setFormStatus("error");
      return;
    }

    try {
      emailjs.init({ publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY! });
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        { from_name: formData.name, name: formData.name, from_email: formData.email, email: formData.email, subject: formData.reason, message: formData.message }
      );
      setFormStatus("success");
      setFormData({ name: "", email: "", reason: "", message: "" });
    } catch (error) {
      console.error("EmailJS error:", error);
      setFormError("Failed to send message. Please try again or contact us directly via GitHub.");
      setFormStatus("error");
    }
  };

  const selectClass = `w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 ${bodyStyles.md} focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50`;

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* About Section */}
        <Card>
          <CardContent className="p-8">
            <h1 className={`${displayStyles.sm} text-text-primary mb-6`}>About SFU Course Planner</h1>

            <p className={`${bodyStyles.lg} text-text-muted mb-8 leading-relaxed`}>
              SFU Course Planner helps students make informed course enrollment decisions by aggregating real-time data
              from multiple sources into one intuitive platform.
            </p>

            <div className="mb-8">
              <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>The Problem</h2>
              <p className={`${bodyStyles.md} text-text-muted leading-relaxed`}>
                SFU students face scattered course information across multiple systems like CourseSys, the SFU Calendar,
                and CourseDiggers. There's no easy way to track enrollment changes, visualize historical trends, or
                compare courses side-by-side. Students often miss enrollment opportunities or make uninformed decisions.
              </p>
            </div>

            <div className="mb-8">
              <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>The Solution</h2>
              <p className={`${bodyStyles.md} text-text-muted leading-relaxed`}>
                This platform consolidates everything you need in one place with a clean, searchable interface that makes
                course planning simple and efficient.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map(({ href, icon: Icon, title, description }) => (
                <Link href={href} key={href} className="no-underline">
                  <div className="p-4 bg-accent/5 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-6 h-6 text-accent" />
                      <h3 className={`${headerStyles.md} text-text-primary`}>{title}</h3>
                    </div>
                    <p className={`${bodyStyles.md} text-text-muted`}>{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardContent className="p-8">
            <h2 className={`${displayStyles.sm} text-text-primary mb-6`}>Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-border rounded-lg overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-surface hover:bg-surface-raised transition-colors"
                  >
                    <span className={`${labelStyles.lg} text-text-primary text-left`}>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 py-4 bg-surface border-t border-border animate-fade-in">
                      <p className={`${bodyStyles.md} text-text-muted leading-relaxed`}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardContent className="p-8">
            <h2 className={`${displayStyles.sm} text-text-primary mb-2`}>Contact Us</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-6`}>
              Have questions, feedback, or found a bug? We'd love to hear from you!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className={`${labelStyles.lg} text-text-primary block mb-2`}>Name *</label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  disabled={formStatus === "loading"}
                />
              </div>

              <div>
                <label htmlFor="email" className={`${labelStyles.lg} text-text-primary block mb-2`}>Email *</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  disabled={formStatus === "loading"}
                />
              </div>

              <div>
                <label htmlFor="reason" className={`${labelStyles.lg} text-text-primary block mb-2`}>Reason *</label>
                <select
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  disabled={formStatus === "loading"}
                  className={selectClass}
                >
                  <option value="">Select a reason</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className={`${labelStyles.lg} text-text-primary block mb-2`}>Message *</label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your question or feedback..."
                  rows={6}
                  disabled={formStatus === "loading"}
                  className="resize-none"
                />
              </div>

              {formStatus === "error" && formError && (
                <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg ${bodyStyles.md} text-destructive`}>
                  {formError}
                </div>
              )}

              {formStatus === "success" && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className={`${labelStyles.lg} text-success`}>
                    Thanks for reaching out! We'll respond within 48 hours.
                  </span>
                </div>
              )}

              <Button type="submit" disabled={formStatus === "loading"} className="w-full sm:w-auto">
                {formStatus === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AboutPageContent />
    </Suspense>
  );
}
