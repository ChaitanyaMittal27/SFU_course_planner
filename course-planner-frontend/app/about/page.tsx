"use client";

import { useState, Suspense } from "react";
import PageContainer from "@/components/PageContainer";
import emailjs from "@emailjs/browser";
import LoadingSpinner from "@/components/LoadingSpinner";

function AboutPageContent() {
  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const faqs = [
    {
      question: "How often is enrollment data updated?",
      answer:
        "Enrollment data is fetched in real-time from SFU's CourseSys whenever you view a course. Historical data shows the last 12 semesters (4 years) of offerings. The data is as current as what you'd see on CourseSys itself.",
    },
    {
      question: "Where does the grade distribution data come from?",
      answer:
        "Grade statistics (median grades, fail rates, distributions) come from CourseDiggers, which aggregates historical grade data from SFU. Note that this data represents overall course averages, not specific semester offerings. Not all courses have grade data available.",
    },
    {
      question: "Is this an official SFU website?",
      answer:
        "No, SFU Course Planner is an independent student project and is not affiliated with or endorsed by Simon Fraser University. All data is publicly available from SFU CourseSys and CourseDiggers.",
    },
    {
      question: "How do Watchers work?",
      answer:
        "Watchers let you monitor specific course sections for enrollment changes. Once authentication is enabled, you'll be able to track courses and receive notifications when seats become available. This feature is currently in development.",
    },
    {
      question: "Can I suggest new features or report bugs?",
      answer:
        "Absolutely! Use the contact form below or open an issue on GitHub. I'm always looking to improve the platform based on user feedback.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");
    setFormError(null);

    // Validation
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
      // Initialize EmailJS
      emailjs.init({
        publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
      });

      // Prepare template parameters matching your EmailJS template
      const templateParams = {
        from_name: formData.name,
        name: formData.name,
        from_email: formData.email,
        email: formData.email,
        subject: formData.reason,
        message: formData.message,
      };

      // Send email
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams
      );

      setFormStatus("success");
      setFormData({ name: "", email: "", reason: "", message: "" });
    } catch (error) {
      console.error("EmailJS error:", error);
      setFormError("Failed to send message. Please try again or contact us directly via GitHub.");
      setFormStatus("error");
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* SECTION 1: ABOUT THIS */}
        <section className="light-card dark:dark-card rounded-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">About SFU Course Planner</h1>

          {/* Hero Statement */}
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            SFU Course Planner helps students make informed course enrollment decisions by aggregating real-time data
            from multiple sources into one intuitive platform.
          </p>

          {/* The Problem */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">The Problem</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              SFU students face scattered course information across multiple systems like CourseSys, the SFU Calendar,
              and CourseDiggers. There's no easy way to track enrollment changes, visualize historical trends, or
              compare courses side-by-side. Students often miss enrollment opportunities or make uninformed decisions.
            </p>
          </div>

          {/* The Solution */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">The Solution</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              This platform consolidates everything you need in one place with a clean, searchable interface that makes
              course planning simple and efficient.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <a href="/browse" className="no-underline">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-colors">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Courses</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Explore 500+ courses across 50+ departments with real-time enrollment data
                </p>
              </div>
            </a>

            <a href="/graph" className="no-underline">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-colors">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyze Trends</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Visualize historical enrollment patterns and grade distributions
                </p>
              </div>
            </a>

            <a href="/watchers" className="no-underline">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-colors">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Track Availability</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Monitor course sections and get notified when seats open up
                </p>
              </div>
            </a>

            <a href="/compare" className="no-underline">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-colors">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compare Courses</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Compare courses and offerings side-by-side to make better decisions
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* SECTION 2: FAQs */}
        <section className="light-card dark:dark-card rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-left font-medium text-gray-900 dark:text-white">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 animate-fade-in">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: CONTACT FORM */}
        <section className="light-card dark:dark-card rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Have questions, feedback, or found a bug? We'd love to hear from you!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={formStatus === "loading"}
                className="input-field"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
                disabled={formStatus === "loading"}
                className="input-field"
              />
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason *
              </label>
              <select
                id="reason"
                name="subject"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={formStatus === "loading"}
                className="input-field"
              >
                <option value="">Select a reason</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please describe your question or feedback..."
                rows={6}
                disabled={formStatus === "loading"}
                className="input-field resize-none"
              />
            </div>

            {/* Error Message */}
            {formStatus === "error" && formError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-sm">{formError}</p>
              </div>
            )}

            {/* Success Message */}
            {formStatus === "success" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 dark:text-green-300 font-medium">
                    Thanks for reaching out! We'll respond within 48 hours.
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formStatus === "loading"}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formStatus === "loading" ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </section>
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
