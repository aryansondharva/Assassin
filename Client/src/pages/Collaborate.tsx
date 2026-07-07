import { FormEvent, useEffect, useState, KeyboardEvent } from "react";
import { useUser } from "@clerk/react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Send,
  ArrowRight,
  ArrowLeft,
  Check
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type {
  CollaborationInterest,
  CollaborationOrganizationType,
  CollaborationRequest,
  CollaborationRequestCreateRequest,
} from "@/types/api";

type FormState = {
  organization_name: string;
  organization_type: CollaborationOrganizationType;
  contact_name: string;
  role_title: string;
  work_email: string;
  phone: string;
  website_url: string;
  collaboration_interests: CollaborationInterest[];
  budget_range: string;
  timeline: string;
  student_audience: string;
  message: string;
};

const initialFormState: FormState = {
  organization_name: "",
  organization_type: "company",
  contact_name: "",
  role_title: "",
  work_email: "",
  phone: "",
  website_url: "",
  collaboration_interests: ["workshops", "hackathons"],
  budget_range: "",
  timeline: "",
  student_audience: "",
  message: "",
};

const organizationTypes: Array<{ value: CollaborationOrganizationType; label: string }> = [
  { value: "company", label: "Company" },
  { value: "startup", label: "Startup" },
  { value: "sponsor", label: "Sponsor" },
  { value: "mentor", label: "Mentor" },
  { value: "tech_organization", label: "Tech organization" },
  { value: "university", label: "University" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

const interestOptions: Array<{ value: CollaborationInterest; label: string }> = [
  { value: "workshops", label: "Workshops" },
  { value: "hackathons", label: "Hackathons" },
  { value: "sponsorships", label: "Sponsorships" },
  { value: "hiring_talent", label: "Hiring Talent" },
  { value: "product_feedback", label: "Product Feedback" },
  { value: "mentorship", label: "Mentorship" },
  { value: "brand_presence", label: "Brand Presence" },
  { value: "campus_events", label: "Campus Events" },
  { value: "internship_connect", label: "Internship Connect" },
  { value: "startup_collaboration", label: "Startup Collaboration" },
  { value: "community_growth", label: "Community Growth" },
  { value: "student_innovation", label: "Student Innovation" },
];

const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default function Collaborate() {
  const { user } = useUser();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<CollaborationRequest | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      contact_name: current.contact_name || user.fullName || user.username || "",
      work_email: current.work_email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [user]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const toggleInterest = (interest: CollaborationInterest) => {
    setFormData((current) => {
      const hasInterest = current.collaboration_interests.includes(interest);
      return {
        ...current,
        collaboration_interests: hasInterest
          ? current.collaboration_interests.filter((item) => item !== interest)
          : [...current.collaboration_interests, interest],
      };
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.contact_name.trim()) {
          toast({ title: "Name is required", description: "Please let us know your full name.", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (!formData.organization_name.trim()) {
          toast({ title: "Organization is required", description: "Please enter your company or community name.", variant: "destructive" });
          return false;
        }
        return true;
      case 5:
        if (!formData.work_email.trim() || !formData.work_email.includes("@")) {
          toast({ title: "Valid email is required", description: "Please enter a valid email address.", variant: "destructive" });
          return false;
        }
        return true;
      case 8:
        if (formData.collaboration_interests.length === 0) {
          toast({ title: "Focus area required", description: "Select at least one collaboration focus.", variant: "destructive" });
          return false;
        }
        return true;
      case 10:
        if (!formData.message.trim()) {
          toast({ title: "Brief is required", description: "Please tell us a bit about your goals.", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true; // Optional fields
    }
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
      } else {
        submitForm();
      }
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.key === "Enter" && currentStep !== 10) {
      e.preventDefault();
      goNext();
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const payload: CollaborationRequestCreateRequest = {
        organization_name: formData.organization_name.trim(),
        organization_type: formData.organization_type,
        contact_name: formData.contact_name.trim(),
        role_title: optional(formData.role_title),
        work_email: formData.work_email.trim(),
        phone: optional(formData.phone),
        website_url: normalizeUrl(formData.website_url),
        collaboration_interests: formData.collaboration_interests,
        budget_range: optional(formData.budget_range),
        timeline: optional(formData.timeline),
        student_audience: optional(formData.student_audience),
        message: formData.message.trim(),
        source_page: "collaborate",
      };

      const request = await api.post<CollaborationRequest>("/collaboration-requests", payload);
      setSubmittedRequest(request);
      toast({
        title: "Collaboration request sent",
        description: "We received your partner intake and will review it soon.",
      });
    } catch (error) {
      const description = error instanceof ApiError ? error.message : "Could not submit your collaboration request.";
      toast({
        title: "Submission failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-red-500 selection:text-white">
      <Navbar dark={true} />

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center pt-20 pb-16">
        <div className="container mx-auto max-w-3xl px-6">
          
          {submittedRequest ? (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-10 text-center backdrop-blur-md shadow-2xl">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-8 w-8 animate-pulse" />
              </span>
              <h2 className="mt-6 text-3xl font-black tracking-tight">Request Received.</h2>
              <p className="mt-4 text-base text-neutral-400 leading-relaxed max-w-lg mx-auto">
                Your collaboration request for <strong className="text-white">{submittedRequest.organization_name}</strong> has been logged in our partner review queue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedRequest(null);
                  setFormData(initialFormState);
                  setCurrentStep(1);
                }}
                className="mt-8 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold shadow-lg transition-colors hover:bg-red-500"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-white/10 bg-neutral-900/40 p-8 md:p-12 backdrop-blur-md shadow-[0_30px_90px_-40px_rgba(0,0,0,0.8)]">
              {/* Top Progress bar and desk header */}
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500">
                    <Clock3 className="h-3 w-3" />
                    Partner Desk
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-500">
                    Step {String(currentStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="mb-12 h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>

              {/* Step Forms */}
              <div className="min-h-[220px]">
                {/* Step 1: Contact Name */}
                {currentStep === 1 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      First, what is your full name? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-neutral-400">Let's get acquainted before diving into details.</p>
                    <input
                      autoFocus
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => updateField("contact_name", e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="mt-6 w-full border-b border-white/20 bg-transparent py-3 text-xl font-bold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Step 2: Organization Name */}
                {currentStep === 2 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      What is the name of your organization? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-neutral-400">Company, university, startup, or community name.</p>
                    <input
                      autoFocus
                      type="text"
                      value={formData.organization_name}
                      onChange={(e) => updateField("organization_name", e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="mt-6 w-full border-b border-white/20 bg-transparent py-3 text-xl font-bold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Step 3: Organization Type */}
                {currentStep === 3 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      What type of organization is this? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-neutral-400">Select the option that matches best.</p>
                    <select
                      autoFocus
                      value={formData.organization_type}
                      onChange={(e) => updateField("organization_type", e.target.value as CollaborationOrganizationType)}
                      onKeyDown={handleKeyPress}
                      className="mt-6 h-14 w-full rounded-lg border border-white/20 bg-neutral-900 px-4 text-lg font-semibold text-white outline-none focus:border-red-500 transition-colors"
                    >
                      {organizationTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Step 4: Role Title */}
                {currentStep === 4 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      What is your role or title?
                    </label>
                    <p className="text-sm text-neutral-400">E.g., Founder, HR, Developer Relations, Student Lead (Optional).</p>
                    <input
                      autoFocus
                      type="text"
                      value={formData.role_title}
                      onChange={(e) => updateField("role_title", e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="mt-6 w-full border-b border-white/20 bg-transparent py-3 text-xl font-bold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Step 5: Work Email */}
                {currentStep === 5 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      What is your email address? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-neutral-400">We'll use this for all professional correspondence.</p>
                    <input
                      autoFocus
                      type="email"
                      value={formData.work_email}
                      onChange={(e) => updateField("work_email", e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="name@company.com"
                      className="mt-6 w-full border-b border-white/20 bg-transparent py-3 text-xl font-bold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Step 6: Phone */}
                {currentStep === 6 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      What is your contact phone number?
                    </label>
                    <p className="text-sm text-neutral-400">Optional, but helpful for urgent calls.</p>
                    <input
                      autoFocus
                      type="text"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="+91 98765 43210"
                      className="mt-6 w-full border-b border-white/20 bg-transparent py-3 text-xl font-bold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Step 7: Website URL */}
                {currentStep === 7 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      Do you have a website or profile URL?
                    </label>
                    <p className="text-sm text-neutral-400">Provide a link to your company website or profile page (Optional).</p>
                    <input
                      autoFocus
                      type="text"
                      value={formData.website_url}
                      onChange={(e) => updateField("website_url", e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="https://company.com"
                      className="mt-6 w-full border-b border-white/20 bg-transparent py-3 text-xl font-bold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Step 8: Collaboration Focus */}
                {currentStep === 8 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      Select your collaboration focus areas <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-neutral-400">Choose all areas you are interested in exploring.</p>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-2">
                      {interestOptions.map((option) => {
                        const checked = formData.collaboration_interests.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleInterest(option.value)}
                            className={`flex items-center justify-between rounded-xl border p-4 text-left font-bold transition-all ${
                              checked
                                ? "border-red-500 bg-red-500/10 text-white"
                                : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className={`flex h-5 w-5 items-center justify-center rounded border ${
                              checked ? "border-red-500 bg-red-500 text-white" : "border-neutral-600"
                            }`}>
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 9: Timeline, Budget & Audience */}
                {currentStep === 9 && (
                  <div className="animate-fade-in space-y-6">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      Tell us about your logistics
                    </label>
                    <p className="text-sm text-neutral-400">All fields are optional.</p>
                    <div className="grid gap-5 sm:grid-cols-3 mt-6">
                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Timeline</span>
                        <input
                          autoFocus
                          type="text"
                          value={formData.timeline}
                          onChange={(e) => updateField("timeline", e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="This month, Q3"
                          className="h-12 w-full rounded-lg border border-white/15 bg-neutral-900 px-4 text-sm font-semibold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Budget Range</span>
                        <input
                          type="text"
                          value={formData.budget_range}
                          onChange={(e) => updateField("budget_range", e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Optional"
                          className="h-12 w-full rounded-lg border border-white/15 bg-neutral-900 px-4 text-sm font-semibold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Audience size</span>
                        <input
                          type="text"
                          value={formData.student_audience}
                          onChange={(e) => updateField("student_audience", e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="50, 200, all"
                          className="h-12 w-full rounded-lg border border-white/15 bg-neutral-900 px-4 text-sm font-semibold text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 10: Message Brief */}
                {currentStep === 10 && (
                  <div className="animate-fade-in space-y-4">
                    <label className="block text-2xl md:text-3xl font-black leading-tight text-white">
                      Briefly describe your partnership goals <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-neutral-400">Target students, preferred format, and what success looks like.</p>
                    <textarea
                      autoFocus
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      placeholder="Tell us what you would like to build together..."
                      className="mt-6 w-full resize-none border-b border-white/20 bg-transparent py-2 text-lg font-medium text-white outline-none focus:border-red-500 transition-colors placeholder:text-neutral-600 leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Navigation panel */}
              <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6">
                <div>
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-600">Press Enter ↵ to advance</span>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={isSubmitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 font-bold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {currentStep === totalSteps ? (
                      isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting
                        </>
                      ) : (
                        <>
                          Submit <Send className="h-4 w-4" />
                        </>
                      )
                    ) : (
                      <>
                        Next <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
