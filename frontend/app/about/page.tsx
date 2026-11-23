"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import SectionCard from "@/components/course/SectionCard";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

const features = [
  {
    href: "/browse",
    title: "Browse Courses",
    description: "Explore 500+ courses across 50+ departments with real-time enrollment data",
  },
  {
    href: "/graph/load",
    title: "Analyze Trends",
    description: "Visualize historical enrollment patterns and grade distributions",
  },
  {
    href: "/dashboard",
    title: "Track Availability",
    description: "Monitor course sections and get notified when seats open up",
  },
  {
    href: "/compare/courses",
    title: "Compare Courses",
    description: "Compare courses and offerings side-by-side to make better decisions",
  },
];

const faqs = [
  {
    question: "How often is enrollment data updated?",
    answer:
      "Enrollment data is fetched in real-time from SFU's CourSys whenever you view a course. Historical data shows the last 12 semesters (4 years) of offerings. The data is as current as what you'd see on CourSys itself.",
  },
  {
    question: "Where does the grade distribution data come from?",
    answer:
      "Grade statistics (median grades, fail rates, distributions) come from CourseDiggers, which aggregates historical grade data from SFU. Note that this data represents overall course averages, not specific semester offerings. Not all courses have grade data available.",
  },
  {
    question: "Is this an official SFU website?",
    answer:
      "No, SFU Course Planner is an independent student project and is not affiliated with or endorsed by Simon Fraser University. All data is publicly available from SFU CourSys and CourseDiggers.",
  },
  {
    question: "How do Bookmarks work?",
    answer:
      "Bookmarks let you save your favorite courses. More importantly, they allow you to track enrollment changes and get notified every day with updates (so you can stay informed). You can manage your bookmarks in the Dashboard section.",
  },
  {
    question: "Can I suggest new features or report bugs?",
    answer:
      "Absolutely! Use the contact form below or open an issue on GitHub. I'm always looking to improve the platform based on user feedback.",
  },
];

const REASONS = ["Bug Report", "Feature Request", "General Inquiry", "Technical Support", "Other"];

type ContactField = "name" | "email" | "reason" | "message";
type ContactForm = Record<ContactField, string>;

const EMPTY_FORM: ContactForm = { name: "", email: "", reason: "", message: "" };

/** Same rules and messages as before; one message per field. */
function validateField(field: ContactField, form: ContactForm): string | null {
  switch (field) {
    case "name":
      return !form.name || form.name.length < 2 ? "Name must be at least 2 characters" : null;
    case "email":
      return !form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "Please enter a valid email address" : null;
    case "reason":
      return !form.reason ? "Please select a reason" : null;
    case "message":
      return !form.message || form.message.length < 10 ? "Message must be at least 10 characters" : null;
  }
}

const FIELDS: ContactField[] = ["name", "email", "reason", "message"];

function ContactForm() {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [sending, setSending] = useState(false);

  const update = (field: ContactField, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    // Once a field shows an error, re-check it as the user types so the error clears.
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validateField(field, next) ?? undefined }));
  };

  const blur = (field: ContactField) => setErrors((prev) => ({ ...prev, [field]: validateField(field, form) ?? undefined }));

  const errorProps = (field: ContactField) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = Object.fromEntries(FIELDS.map((field) => [field, validateField(field, form) ?? undefined])) as Partial<Record<ContactField, string>>;
    setErrors(found);
    const firstInvalid = FIELDS.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, reason: form.reason, message: form.message }),
      });
      if (!response.ok) throw new Error("Failed to send");
      toast.success("Thanks for reaching out! We'll respond ASAP.");
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again or contact us directly via GitHub.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="name">Name *</FieldLabel>
        <Input id="name" type="text" value={form.name} placeholder="John Doe" disabled={sending}
          onChange={(e) => update("name", e.target.value)} onBlur={() => blur("name")} {...errorProps("name")} />
        <FieldError id="name-error">{errors.name}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="email">Email *</FieldLabel>
        <Input id="email" type="email" value={form.email} placeholder="john.doe@example.com" disabled={sending}
          onChange={(e) => update("email", e.target.value)} onBlur={() => blur("email")} {...errorProps("email")} />
        <FieldError id="email-error">{errors.email}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.reason)}>
        <FieldLabel htmlFor="reason">Reason *</FieldLabel>
        <NativeSelect id="reason" className="w-full" value={form.reason} disabled={sending}
          onChange={(e) => update("reason", e.target.value)} onBlur={() => blur("reason")} {...errorProps("reason")}>
          <NativeSelectOption value="">Select a reason</NativeSelectOption>
          {REASONS.map((reason) => (
            <NativeSelectOption key={reason} value={reason}>
              {reason}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError id="reason-error">{errors.reason}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.message)}>
        <FieldLabel htmlFor="message">Message *</FieldLabel>
        <Textarea id="message" value={form.message} placeholder="Please describe your question or feedback..." rows={6} disabled={sending}
          className="resize-none" onChange={(e) => update("message", e.target.value)} onBlur={() => blur("message")} {...errorProps("message")} />
        <FieldError id="message-error">{errors.message}</FieldError>
      </Field>

      <Button type="submit" disabled={sending} className="w-full sm:w-auto">
        {sending ? (
          <>
            <Spinner aria-hidden="true" role="presentation" aria-label={undefined} />
            Sending...
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader
        title="About SFU Course Planner"
        description="SFU Course Planner helps students make informed course enrollment decisions by aggregating real-time data from multiple sources into one intuitive platform."
      />

      <div className="mb-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className={cn(headerStyles.lg, "mb-2 text-text-primary")}>The Problem</h2>
          <p className={cn(bodyStyles.md, "text-text-muted")}>
            SFU students face scattered course information across multiple systems like CourseSys, the SFU Calendar, and
            CourseDiggers. There&apos;s no easy way to track enrollment changes, visualize historical trends, or compare
            courses side-by-side. Students often miss enrollment opportunities or make uninformed decisions.
          </p>
        </section>
        <section>
          <h2 className={cn(headerStyles.lg, "mb-2 text-text-primary")}>The Solution</h2>
          <p className={cn(bodyStyles.md, "text-text-muted")}>
            This platform consolidates everything you need in one place with a clean, searchable interface that makes
            course planning simple and efficient.
          </p>
        </section>
      </div>

      <SectionCard title="What you can do" flush className="mb-6">
        <ul className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:[&>li:nth-child(n+3)]:border-t sm:[&>li:nth-child(even)]:border-l [&>li]:border-border">
          {features.map(({ href, title, description }) => (
            <li key={href} className="p-4 sm:p-5">
              <h3 className={cn(headerStyles.sm, "text-text-primary")}>
                <Link href={href} className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {title}
                </Link>
              </h3>
              <p className={cn(bodyStyles.md, "mt-1 text-text-muted")}>{description}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <SectionCard title="Frequently asked questions">
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question} className="border-border">
                <AccordionTrigger className={cn(labelStyles.lg, "py-3 text-text-primary")}>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className={cn(bodyStyles.md, "pb-3 text-text-muted")}>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionCard>

        <SectionCard title="Contact us" description="Have questions, feedback, or found a bug? We'd love to hear from you!">
          <ContactForm />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
