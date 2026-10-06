import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Eye,
  FileText,
  FileCheck,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Pencil,
  Save,
  Search,
  UserCheck,
  UserRound,
  Video,
  X,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


// ============================================================
// API
// ============================================================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sellopedia_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ============================================================
// TYPES
// ============================================================

type RequirementItem = {
  text: string;
};

type JobSkill = {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  required: boolean;
};

type HiringStep = {
  title: string;
  description?: string;
  order?: number;
};

type JobOpening = {
  _id: string;
  title: string;
  jobCode?: string;
  department?: { _id: string; name: string } | null;
  designation?: { _id: string; name: string } | null;
  shortDescription?: string;
  description?: string;
  responsibilities?: RequirementItem[];
  requirements?: RequirementItem[];
  qualifications?: RequirementItem[];
  preferredQualifications?: RequirementItem[];
  skills?: JobSkill[];
  experience?: {
    minimumYears?: number;
    maximumYears?: number | null;
    description?: string;
  };
  education?: {
    minimumQualification?: string;
    preferredQualification?: string;
    fields?: string[];
  };
  employmentType?: "full_time" | "part_time" | "contract" | "internship";
  workMode?: "office" | "hybrid" | "remote";
  location?: string;
  openings?: number;
  salary?: {
    isDisclosed?: boolean;
    minimum?: number | null;
    maximum?: number | null;
    currency?: string;
    period?: "hourly" | "monthly" | "yearly";
    description?: string;
  };
  benefits?: string[];
  hiringProcess?: HiringStep[];
  applicationEmail?: string;
  applicationInstructions?: string;
  status?: "draft" | "upcoming" | "active" | "paused" | "closed" | "cancelled";
  publishedAt?: string | null;
  closingDate?: string | null;
  publicId?: string;
  publicSlug?: string;
  isPublic?: boolean;
  publicUrl?: string | null;
  shareCount?: number;
  viewCount?: number;
  applicationCount?: number;
  internalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type JobEditForm = {
  title: string;
  jobCode: string;
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  preferredQualifications: string[];
  skills: JobSkill[];
  minimumExperience: number;
  maximumExperience: string;
  experienceDescription: string;
  minimumQualification: string;
  preferredQualification: string;
  educationFields: string[];
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  workMode: "office" | "hybrid" | "remote";
  location: string;
  openings: number;
  salaryDisclosed: boolean;
  salaryMinimum: string;
  salaryMaximum: string;
  salaryCurrency: string;
  salaryPeriod: "hourly" | "monthly" | "yearly";
  salaryDescription: string;
  benefits: string[];
  hiringProcess: HiringStep[];
  applicationEmail: string;
  applicationInstructions: string;
  status: "draft" | "upcoming" | "active" | "paused" | "closed" | "cancelled";
  publishedAt: string;
  closingDate: string;
  publicId: string;
  publicSlug: string;
  isPublic: boolean;
  publicUrl: string;
  internalNotes: string;
};

type Candidate = {
  _id: string;
  name: string;
  email: string;
  phone?: string;

  resumeUrl?: string;

  source?: string;

  status:
    | "applied"
    | "screening"
    | "interview"
    | "selected"
    | "rejected"
    | "joined"
    | "withdrawn";


  offerStatus?:
    | "not_generated"
    | "sent"
    | "accepted"
    | "declined";

  joiningDate?: string;
  employee?: string | { _id: string };
  notes?: string;
  experience?: string;
  education?: string;

  jobOpening?: {
    _id: string;
    title: string;
    department?: {
      _id: string;
      name: string;
    } | string | null;
    designation?: {
      _id: string;
      name: string;
    } | string | null;
  } | null;

  createdAt?: string;
};

type Interview = {
  _id: string;

  candidate?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;

    jobOpening?: {
      _id: string;
      title: string;
    } | null;
  };

  scheduledAt: string;

  type?: "virtual" | "physical";

  locationOrLink?: string;

  interviewer?: {
    _id: string;
    name: string;
    email?: string;
  } | null;

  status?:
    | "scheduled"
    | "completed"
    | "cancelled"
    | "rescheduled";

  rating?: number;

  feedback?: string;

  createdAt?: string;
};

type Tab =
  | "overview"
  | "jobs"
  | "candidates"
  | "interviews"
  | "documents";

type InterviewForm = {
  candidate: string;
  date: string;
  time: string;
  type: "" | "virtual" | "physical";
  locationOrLink: string;
  interviewer: string;
};


// ============================================================
// TOAST
// ============================================================

const showToast = (
  message: string,
  type: "success" | "error" = "success"
) => {
  if (type === "success") {
    console.log("SUCCESS:", message);
  } else {
    console.error("ERROR:", message);
  }

  // Replace this with your existing toast implementation
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hrms-toast", {
        detail: {
          message,
          type,
        },
      })
    );
  }
};


// ============================================================
// HELPERS
// ============================================================

const formatStatus = (value?: string) => {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (date?: string) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (date?: string) => {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatInterviewStatus = (
  status?: string
) => {
  if (!status) return "Unknown";

  return status
    .replace("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getInterviewStatusClass = (
  status?: string
) => {
  switch (status) {
    case "scheduled":
      return "bg-red-50 text-red-700";

    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    case "rescheduled":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getCandidateStatusClass = (
  status?: string
) => {
  switch (status) {
    case "selected":
      return "bg-green-50 text-green-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "interview":
      return "bg-red-50 text-red-700";

    case "screening":
      return "bg-yellow-50 text-yellow-700";

    case "joined":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};


const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100";
const selectClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100";
const textareaClass = "w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100";

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h3 className="text-base font-bold text-gray-900">{title}</h3>{action}</div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}

function EditableStringList({ title, items, onChange, compact = false }: { title: string; items: string[]; onChange: (items: string[]) => void; compact?: boolean }) {
  const update = (index: number, value: string) => onChange(items.map((item, i) => i === index ? value : item));
  const add = () => onChange([...items, ""]);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index).length ? items.filter((_, i) => i !== index) : [""]);
  return <div className="rounded-xl border border-gray-200 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="font-semibold text-gray-900">{title}</h4><button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-blue-100"><Plus className="h-3.5 w-3.5" /> Add</button></div><div className="space-y-2">{items.map((item, index) => <div key={`${title}-${index}`} className="flex gap-2"><input value={item} onChange={(e) => update(index, e.target.value)} className={`${inputClass} ${compact ? "py-2" : ""}`} placeholder={`Enter ${title.toLowerCase()}...`} /><button type="button" onClick={() => remove(index)} className="rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button></div>)}</div></div>;
}

function ReadList({ title, items }: { title: string; items: string[] }) {
  const visible = items.filter(Boolean);
  return <section className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-900">{title}</h3>{visible.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">{visible.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No items added.</p>}</section>;
}

// ============================================================
// COMPONENT
// ============================================================

const Recruitment: React.FC = () => {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const [jobs, setJobs] =
    useState<JobOpening[]>([]);

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [interviews, setInterviews] =
    useState<Interview[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingInterviews, setLoadingInterviews] =
    useState(false);

  const [savingInterview, setSavingInterview] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [candidateStatusFilter, setCandidateStatusFilter] =
    useState("all");

  const [interviewStatusFilter, setInterviewStatusFilter] =
    useState("all");

  const [showScheduleModal, setShowScheduleModal] =
    useState(false);

  const [showOfferModal, setShowOfferModal] =
    useState(false);

  const [showAppointmentModal, setShowAppointmentModal] =
    useState(false);

  const [offerCandidate, setOfferCandidate] =
    useState<Candidate | null>(null);

  const [appointmentCandidate, setAppointmentCandidate] =
    useState<Candidate | null>(null);

  const [offerForm, setOfferForm] = useState({
    designation: "",
    salary: "",
    joiningDate: new Date().toISOString().slice(0, 10),
  });

  const [appointmentForm, setAppointmentForm] = useState({
    joiningDate: new Date().toISOString().slice(0, 10),
  });

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const [selectedJob, setSelectedJob] =
    useState<JobOpening | null>(null);

  const [showJobDetails, setShowJobDetails] =
    useState(false);

  const [editingJob, setEditingJob] =
    useState(false);

  const [savingJob, setSavingJob] =
    useState(false);

  const emptyJobEditForm: JobEditForm = {
    title: "",
    jobCode: "",
    shortDescription: "",
    description: "",
    responsibilities: [""],
    requirements: [""],
    qualifications: [""],
    preferredQualifications: [""],
    skills: [],
    minimumExperience: 0,
    maximumExperience: "",
    experienceDescription: "",
    minimumQualification: "",
    preferredQualification: "",
    educationFields: [""],
    employmentType: "full_time",
    workMode: "office",
    location: "",
    openings: 1,
    salaryDisclosed: false,
    salaryMinimum: "",
    salaryMaximum: "",
    salaryCurrency: "INR",
    salaryPeriod: "yearly",
    salaryDescription: "",
    benefits: [""],
    hiringProcess: [],
    applicationEmail: "",
    applicationInstructions: "",
    status: "draft",
    publishedAt: "",
    closingDate: "",
    publicId: "",
    publicSlug: "",
    isPublic: false,
    publicUrl: "",
    internalNotes: "",
  };

  const [jobEditForm, setJobEditForm] =
    useState<JobEditForm>(emptyJobEditForm);

  const [showCandidateDetails, setShowCandidateDetails] =
    useState(false);

  const [showMailModal, setShowMailModal] =
    useState(false);

  const [mailSending, setMailSending] =
    useState(false);

  const [mailForm, setMailForm] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    category: "recruitment",
    template: "custom",
    message: "",
  });

  const [selectedInterview, setSelectedInterview] =
    useState<Interview | null>(null);

  const [showInterviewDetails, setShowInterviewDetails] =
    useState(false);

  const [updatingInterview, setUpdatingInterview] =
    useState<string | null>(null);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [interviewForm, setInterviewForm] =
    useState<InterviewForm>({
      candidate: "",
      date: "",
      time: "",
      type: "",
      locationOrLink: "",
      interviewer: "",
    });


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    loadAll();
  }, []);


  const loadAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadJobs(),
        loadCandidates(),
        loadInterviews(),
      ]);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOAD JOBS
  // ==========================================================

  const loadJobs = async () => {
    try {
      const response =
        await api.get("/hr/jobs");

      const data =
        response.data?.data;

      setJobs(
        data?.items ||
        data ||
        []
      );
    } catch (error) {
      console.error(
        "Failed to load jobs:",
        error
      );
    }
  };


  // ==========================================================
  // LOAD CANDIDATES
  // ==========================================================

  const loadCandidates = async () => {
    try {
      const response =
        await api.get("/hr/candidates");

      const data =
        response.data?.data;

      setCandidates(
        data?.items ||
        data ||
        []
      );
    } catch (error) {
      console.error(
        "Failed to load candidates:",
        error
      );
    }
  };


  // ==========================================================
  // LOAD INTERVIEWS
  // ==========================================================

  const loadInterviews = async () => {
    try {
      setLoadingInterviews(true);

      const response =
        await api.get("/hr/interviews");

      const data =
        response.data?.data;

      setInterviews(
        data?.items ||
        data ||
        []
      );
    } catch (error) {
      console.error(
        "Failed to load interviews:",
        error
      );
    } finally {
      setLoadingInterviews(false);
    }
  };


  // ==========================================================

  // ============================================================
  // RECRUITMENT DETAILS + EMAIL
  // ============================================================

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  const requirementTexts = (items?: RequirementItem[]) =>
    items?.length ? items.map((item) => item?.text || "") : [""];

  const cleanStringArray = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean);

  const openJobDetails = (job: JobOpening) => {
    setSelectedJob(job);
    setJobEditForm({
      title: job.title || "",
      jobCode: job.jobCode || "",
      shortDescription: job.shortDescription || "",
      description: job.description || "",
      responsibilities: requirementTexts(job.responsibilities),
      requirements: requirementTexts(job.requirements),
      qualifications: requirementTexts(job.qualifications),
      preferredQualifications: requirementTexts(job.preferredQualifications),
      skills: (job.skills || []).map((skill) => ({
        name: skill?.name || "",
        level: skill?.level || "intermediate",
        required: skill?.required !== false,
      })),
      minimumExperience: Number(job.experience?.minimumYears ?? 0) || 0,
      maximumExperience:
        job.experience?.maximumYears === null || job.experience?.maximumYears === undefined
          ? ""
          : String(job.experience.maximumYears),
      experienceDescription: job.experience?.description || "",
      minimumQualification: job.education?.minimumQualification || "",
      preferredQualification: job.education?.preferredQualification || "",
      educationFields: job.education?.fields?.length ? [...job.education.fields] : [""],
      employmentType: job.employmentType || "full_time",
      workMode: job.workMode || "office",
      location: job.location || "",
      openings: Math.max(1, Number(job.openings ?? 1) || 1),
      salaryDisclosed: job.salary?.isDisclosed === true,
      salaryMinimum:
        job.salary?.minimum === null || job.salary?.minimum === undefined
          ? ""
          : String(job.salary.minimum),
      salaryMaximum:
        job.salary?.maximum === null || job.salary?.maximum === undefined
          ? ""
          : String(job.salary.maximum),
      salaryCurrency: job.salary?.currency || "INR",
      salaryPeriod: job.salary?.period || "yearly",
      salaryDescription: job.salary?.description || "",
      benefits: job.benefits?.length ? [...job.benefits] : [""],
      hiringProcess: (job.hiringProcess || []).map((step, index) => ({
        title: step?.title || "",
        description: step?.description || "",
        order: step?.order ?? index + 1,
      })),
      applicationEmail: job.applicationEmail || "",
      applicationInstructions: job.applicationInstructions || "",
      status: job.status || "draft",
      publishedAt: toDateInput(job.publishedAt),
      closingDate: toDateInput(job.closingDate),
      publicId: job.publicId || "",
      publicSlug: job.publicSlug || "",
      isPublic: job.isPublic === true,
      publicUrl: job.publicUrl || "",
      internalNotes: job.internalNotes || "",
    });
    setEditingJob(false);
    setShowJobDetails(true);
  };

  const saveJobDetails = async () => {
    if (!selectedJob) return;

    if (!jobEditForm.title.trim()) {
      showToast("Job title is required", "error");
      return;
    }

    if (!jobEditForm.description.trim()) {
      showToast("Job description is required", "error");
      return;
    }

    if (jobEditForm.salaryDisclosed) {
      const minimum = jobEditForm.salaryMinimum === "" ? null : Number(jobEditForm.salaryMinimum);
      const maximum = jobEditForm.salaryMaximum === "" ? null : Number(jobEditForm.salaryMaximum);

      if (minimum !== null && minimum < 0) {
        showToast("Minimum salary cannot be negative", "error");
        return;
      }

      if (maximum !== null && maximum < 0) {
        showToast("Maximum salary cannot be negative", "error");
        return;
      }

      if (minimum !== null && maximum !== null && maximum < minimum) {
        showToast("Maximum salary cannot be less than minimum salary", "error");
        return;
      }
    }

    if (
      jobEditForm.maximumExperience !== "" &&
      Number(jobEditForm.maximumExperience) < Number(jobEditForm.minimumExperience)
    ) {
      showToast("Maximum experience cannot be less than minimum experience", "error");
      return;
    }

    try {
      setSavingJob(true);

      const payload = {
        title: jobEditForm.title.trim(),
        jobCode: jobEditForm.jobCode.trim() || undefined,
        shortDescription: jobEditForm.shortDescription.trim(),
        description: jobEditForm.description.trim(),
        responsibilities: cleanStringArray(jobEditForm.responsibilities).map((text) => ({ text })),
        requirements: cleanStringArray(jobEditForm.requirements).map((text) => ({ text })),
        qualifications: cleanStringArray(jobEditForm.qualifications).map((text) => ({ text })),
        preferredQualifications: cleanStringArray(jobEditForm.preferredQualifications).map((text) => ({ text })),
        skills: jobEditForm.skills
          .filter((skill) => skill.name.trim())
          .map((skill) => ({
            name: skill.name.trim(),
            level: skill.level,
            required: skill.required,
          })),
        experience: {
          minimumYears: Math.max(0, Number(jobEditForm.minimumExperience) || 0),
          maximumYears:
            jobEditForm.maximumExperience === ""
              ? null
              : Math.max(0, Number(jobEditForm.maximumExperience)),
          description: jobEditForm.experienceDescription.trim(),
        },
        education: {
          minimumQualification: jobEditForm.minimumQualification.trim(),
          preferredQualification: jobEditForm.preferredQualification.trim(),
          fields: cleanStringArray(jobEditForm.educationFields),
        },
        employmentType: jobEditForm.employmentType,
        workMode: jobEditForm.workMode,
        location: jobEditForm.location.trim(),
        openings: Math.max(1, Number(jobEditForm.openings) || 1),
        salary: {
          isDisclosed: jobEditForm.salaryDisclosed,
          minimum:
            jobEditForm.salaryMinimum === "" ? null : Math.max(0, Number(jobEditForm.salaryMinimum)),
          maximum:
            jobEditForm.salaryMaximum === "" ? null : Math.max(0, Number(jobEditForm.salaryMaximum)),
          currency: jobEditForm.salaryCurrency.trim() || "INR",
          period: jobEditForm.salaryPeriod,
          description: jobEditForm.salaryDescription.trim(),
        },
        benefits: cleanStringArray(jobEditForm.benefits),
        hiringProcess: jobEditForm.hiringProcess
          .filter((step) => step.title.trim())
          .map((step, index) => ({
            title: step.title.trim(),
            description: step.description?.trim() || "",
            order: index + 1,
          })),
        applicationEmail: jobEditForm.applicationEmail.trim().toLowerCase(),
        applicationInstructions: jobEditForm.applicationInstructions.trim(),
        status: jobEditForm.status,
        publishedAt: jobEditForm.publishedAt || null,
        closingDate: jobEditForm.closingDate || null,
        publicId: jobEditForm.publicId.trim() || undefined,
        publicSlug: jobEditForm.publicSlug.trim().toLowerCase() || undefined,
        isPublic: jobEditForm.isPublic,
        publicUrl: jobEditForm.publicUrl.trim() || null,
        internalNotes: jobEditForm.internalNotes.trim(),
      };

      const response = await api.put(`/hr/jobs/${selectedJob._id}`, payload);
      const updated = response.data?.data || response.data?.job || response.data;

      const mergedJob: JobOpening = {
        ...selectedJob,
        ...(updated && typeof updated === "object" ? updated : {}),
        ...payload,
        responsibilities: payload.responsibilities,
        requirements: payload.requirements,
        qualifications: payload.qualifications,
        preferredQualifications: payload.preferredQualifications,
        skills: payload.skills,
        experience: payload.experience,
        education: payload.education,
        salary: payload.salary,
        hiringProcess: payload.hiringProcess,
        benefits: payload.benefits,
      } as JobOpening;

      setJobs((current) =>
        current.map((job) => job._id === selectedJob._id ? mergedJob : job)
      );
      setSelectedJob(mergedJob);
      setEditingJob(false);
      showToast("Job details updated successfully.");
    } catch (error: any) {
      console.error("Update job error:", error);
      showToast(
        error?.response?.data?.message || "Failed to update job details.",
        "error"
      );
    } finally {
      setSavingJob(false);
    }
  };

  const resetJobEditForm = () => {
    if (selectedJob) openJobDetails(selectedJob);
  };

  const openCandidateDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const getMailTemplate = (
    candidate: Candidate,
    template: string
  ) => {
    const job = jobs.find(
      (item) => item._id === candidate.jobOpening?._id
    );

    const title =
      job?.title ||
      candidate.jobOpening?.title ||
      "the position";

    const templates: Record<string, {subject:string; message:string}> = {
      screening: {
        subject: `Application Update - ${title}`,
        message: `Dear ${candidate.name},\n\nThank you for applying for ${title}. Your application is currently under review. We will update you regarding the next step shortly.\n\nRegards,\nHR Team`,
      },
      interview: {
        subject: `Interview Invitation - ${title}`,
        message: `Dear ${candidate.name},\n\nThank you for your interest in ${title}. We would like to invite you for an interview with our team.\n\nPlease reply to this email if you have any questions or need to reschedule.\n\nRegards,\nHR Team`,
      },
      selection: {
        subject: `Selection Update - ${title}`,
        message: `Dear ${candidate.name},\n\nWe are pleased to inform you that your application for ${title} has progressed to the selection stage. Our HR team will share the next steps shortly.\n\nRegards,\nHR Team`,
      },
      offer: {
        subject: `Offer Update - ${title}`,
        message: `Dear ${candidate.name},\n\nWe are pleased to move forward with your candidature for ${title}. Our HR team will share the offer details and joining formalities with you.\n\nRegards,\nHR Team`,
      },
      rejection: {
        subject: `Application Update - ${title}`,
        message: `Dear ${candidate.name},\n\nThank you for your interest in ${title}. After reviewing your application, we will not be proceeding with your candidature at this stage. We appreciate your time and wish you success.\n\nRegards,\nHR Team`,
      },
      custom: {
        subject: "",
        message: `Dear ${candidate.name},\n\n\n\nRegards,\nHR Team`,
      },
    };

    return templates[template] || templates.custom;
  };

  const openCandidateMail = (
    candidate: Candidate,
    template = "custom"
  ) => {
    const selected = getMailTemplate(candidate, template);

    setSelectedCandidate(candidate);
    setMailForm({
      to: candidate.email || "",
      cc: "",
      bcc: "",
      subject: selected.subject,
      category: "recruitment",
      template,
      message: selected.message,
    });

    setShowCandidateDetails(false);
    setShowMailModal(true);
  };

  const updateMailTemplate = (template: string) => {
    if (!selectedCandidate) return;

    const selected = getMailTemplate(
      selectedCandidate,
      template
    );

    setMailForm((prev) => ({
      ...prev,
      template,
      subject: selected.subject,
      message: selected.message,
    }));
  };

  const sendRecruitmentEmail = async () => {
    if (
      !mailForm.to.trim() ||
      !mailForm.subject.trim() ||
      !mailForm.message.trim()
    ) {
      alert("Recipient, subject and message are required.");
      return;
    }

    try {
      setMailSending(true);

      const formData = new FormData();
      formData.append("to", mailForm.to.trim());

      if (mailForm.cc.trim()) {
        formData.append("cc", mailForm.cc.trim());
      }

      if (mailForm.bcc.trim()) {
        formData.append("bcc", mailForm.bcc.trim());
      }

      formData.append("subject", mailForm.subject.trim());
      formData.append("text", mailForm.message.trim());
      formData.append(
        "html",
        mailForm.message.trim().replace(/\n/g, "<br />")
      );
      formData.append("category", mailForm.category);

      if (selectedCandidate?._id) {
        formData.append(
          "relatedCandidate",
          selectedCandidate._id
        );
      }

      await api.post("/email/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Recruitment email sent successfully.");
      setShowMailModal(false);
    } catch (error: any) {
      console.error("Recruitment email error:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to send recruitment email."
      );
    } finally {
      setMailSending(false);
    }
  };


  // FILTER CANDIDATES
  // ==========================================================

  const filteredCandidates =
    useMemo(() => {
      return candidates.filter(
        (candidate) => {
          const searchValue =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchValue ||
            candidate.name
              ?.toLowerCase()
              .includes(searchValue) ||
            candidate.email
              ?.toLowerCase()
              .includes(searchValue) ||
            candidate.phone
              ?.toLowerCase()
              .includes(searchValue);

          const matchesStatus =
            candidateStatusFilter ===
              "all" ||
            candidate.status ===
              candidateStatusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      candidates,
      search,
      candidateStatusFilter,
    ]);


  // ==========================================================
  // FILTER INTERVIEWS
  // ==========================================================

  const filteredInterviews =
    useMemo(() => {
      return interviews.filter(
        (interview) => {
          const searchValue =
            search
              .trim()
              .toLowerCase();

          const candidateName =
            interview.candidate?.name ||
            "";

          const candidateEmail =
            interview.candidate?.email ||
            "";

          const matchesSearch =
            !searchValue ||
            candidateName
              .toLowerCase()
              .includes(searchValue) ||
            candidateEmail
              .toLowerCase()
              .includes(searchValue);

          const matchesStatus =
            interviewStatusFilter ===
              "all" ||
            interview.status ===
              interviewStatusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      interviews,
      search,
      interviewStatusFilter,
    ]);


  // ==========================================================
  // INTERVIEW FORM RESET
  // ==========================================================

  const resetInterviewForm = () => {
    setInterviewForm({
      candidate: "",
      date: "",
      time: "",
      type: "",
      locationOrLink: "",
      interviewer: "",
    });
  };


  // ==========================================================
  // OPEN SCHEDULE MODAL
  // ==========================================================

  const openScheduleModal = (
    candidateId = ""
  ) => {
    resetInterviewForm();

    if (candidateId) {
      setInterviewForm((prev) => ({
        ...prev,
        candidate: candidateId,
      }));
    }

    setShowScheduleModal(true);
  };


  // ==========================================================
  // CLOSE SCHEDULE MODAL
  // ==========================================================

  const closeScheduleModal = () => {
    if (savingInterview) return;

    setShowScheduleModal(false);

    resetInterviewForm();
  };


  // ==========================================================
  // SCHEDULE INTERVIEW
  // ==========================================================

  const scheduleInterview = async () => {

    // --------------------------------------------------------
    // Required validation
    // --------------------------------------------------------

    if (!interviewForm.candidate) {
      showToast(
        "Candidate is required",
        "error"
      );
      return;
    }

    if (!interviewForm.date) {
      showToast(
        "Scheduled date is required",
        "error"
      );
      return;
    }

    if (!interviewForm.time) {
      showToast(
        "Scheduled time is required",
        "error"
      );
      return;
    }

    if (!interviewForm.type) {
      showToast(
        "Interview type is required",
        "error"
      );
      return;
    }


    // --------------------------------------------------------
    // Validate type
    // --------------------------------------------------------

    if (
      interviewForm.type !==
        "virtual" &&
      interviewForm.type !==
        "physical"
    ) {
      showToast(
        "Invalid interview type",
        "error"
      );
      return;
    }


    // --------------------------------------------------------
    // Create date
    // --------------------------------------------------------

    const scheduledAt =
      new Date(
        `${interviewForm.date}T${interviewForm.time}:00`
      );

    if (
      Number.isNaN(
        scheduledAt.getTime()
      )
    ) {
      showToast(
        "Invalid scheduled date or time",
        "error"
      );
      return;
    }


    // --------------------------------------------------------
    // Prepare payload
    // --------------------------------------------------------

    const payload: {
      candidate: string;
      scheduledAt: string;
      type:
        | "virtual"
        | "physical";
      locationOrLink?: string;
      interviewer?: string;
      status: "scheduled";
    } = {
      candidate:
        interviewForm.candidate,

      scheduledAt:
        scheduledAt.toISOString(),

      // IMPORTANT:
      // Backend expects `type`
      type:
        interviewForm.type,

      status: "scheduled",
    };


    // --------------------------------------------------------
    // Location / Meeting Link
    // --------------------------------------------------------

    const locationOrLink =
      interviewForm.locationOrLink
        .trim();

    if (locationOrLink) {
      payload.locationOrLink =
        locationOrLink;
    }


    // --------------------------------------------------------
    // Interviewer
    //
    // Must be User ObjectId.
    // --------------------------------------------------------

    const interviewer =
      interviewForm.interviewer
        .trim();

    if (interviewer) {
      payload.interviewer =
        interviewer;
    }


    // --------------------------------------------------------
    // Submit
    // --------------------------------------------------------

    try {
      setSavingInterview(true);

      console.log(
        "Scheduling interview:",
        payload
      );

      const response =
        await api.post(
          "/hr/interviews",
          payload
        );

      console.log(
        "Interview response:",
        response.data
      );

      showToast(
        "Interview scheduled successfully"
      );

      setShowScheduleModal(false);

      resetInterviewForm();

      await loadInterviews();

      setActiveTab("interviews");

    } catch (error: any) {

      console.error(
        "Schedule interview error:",
        error
      );

      console.error(
        "Backend response:",
        error?.response?.data
      );

      const message =
        error?.response?.data
          ?.message ||
        error?.response?.data
          ?.error ||
        "Failed to schedule interview";

      showToast(
        message,
        "error"
      );

    } finally {
      setSavingInterview(false);
    }
  };


  // ==========================================================
  // UPDATE INTERVIEW STATUS
  // ==========================================================

  const updateInterviewStatus = async (
    interviewId: string,
    status:
      | "scheduled"
      | "completed"
      | "cancelled"
      | "rescheduled"
  ) => {
    try {
      setUpdatingInterview(
        interviewId
      );

      await api.patch(
        `/hr/interviews/${interviewId}`,
        {
          status,
        }
      );

      showToast(
        `Interview marked as ${formatInterviewStatus(
          status
        )}`
      );

      await loadInterviews();

    } catch (error: any) {
      console.error(
        "Update interview error:",
        error
      );

      showToast(
        error?.response?.data
          ?.message ||
          "Failed to update interview",
        "error"
      );
    } finally {
      setUpdatingInterview(null);
    }
  };


  // ==========================================================
  // CANDIDATE ACTIONS
  // ==========================================================

  const openOfferModal = (candidate: Candidate) => {
    setOfferCandidate(candidate);
    setOfferForm({
      designation:
        candidate.jobOpening?.title ||
        candidate.jobOpening?.title ||
        "Employee",
      salary: "",
      joiningDate:
        candidate.joiningDate?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
    });
    setShowOfferModal(true);
  };

  const openAppointmentModal = (candidate: Candidate) => {
    setAppointmentCandidate(candidate);
    setAppointmentForm({
      joiningDate:
        candidate.joiningDate?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
    });
    setShowAppointmentModal(true);
  };

  const generateOfferLetter = async () => {
    if (!offerCandidate) return;
    if (!offerForm.designation.trim()) {
      showToast("Designation is required", "error");
      return;
    }
    if (!offerForm.salary || Number(offerForm.salary) <= 0) {
      showToast("Enter a valid monthly salary", "error");
      return;
    }
    if (!offerForm.joiningDate) {
      showToast("Joining date is required", "error");
      return;
    }

    try {
      setActionLoading(`${offerCandidate._id}-offer`);
      await api.post(`/hr/documents/offer/${offerCandidate._id}`, {
        designation: offerForm.designation.trim(),
        salary: Number(offerForm.salary),
        joiningDate: offerForm.joiningDate,
      });
      setShowOfferModal(false);
      setOfferCandidate(null);
      showToast("Offer Letter generated and sent successfully.");
      await loadCandidates();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          "Failed to generate offer letter",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const generateAppointmentLetter = async () => {
    if (!appointmentCandidate) return;

    const employeeId =
      typeof appointmentCandidate.employee === "string"
        ? appointmentCandidate.employee
        : appointmentCandidate.employee?._id || "";

    if (!employeeId) {
      showToast(
        "This candidate is not linked to an Employee HR Profile yet. Mark the candidate joined first.",
        "error"
      );
      return;
    }

    if (!appointmentForm.joiningDate) {
      showToast("Joining date is required", "error");
      return;
    }

    try {
      setActionLoading(`${appointmentCandidate._id}-appointment`);

      await api.post(
        `/hr/documents/appointment/${employeeId}`,
        { joiningDate: appointmentForm.joiningDate }
      );

      setShowAppointmentModal(false);
      setAppointmentCandidate(null);
      showToast(
        `Appointment Letter generated for ${appointmentCandidate.name}.`
      );
      await loadCandidates();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          "Failed to generate appointment letter",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const candidateAction = async (
    candidateId: string,
    action: "accept-offer" | "join" | "reject"
  ) => {
    try {
      setActionLoading(`${candidateId}-${action}`);
      let response;

      switch (action) {
        case "accept-offer":
          response = await api.patch(
            `/hr/candidates/${candidateId}/offer/accept`
          );
          break;
        case "join": {
          const candidate = candidates.find(
            (item) => item._id === candidateId
          );

          if (!candidate) {
            throw new Error("Candidate not found.");
          }

          if (candidate.offerStatus !== "accepted") {
            throw new Error(
              "The offer must be accepted before converting the candidate into an employee."
            );
          }

          if (candidate.employee) {
            showToast(
              "This candidate is already linked to an employee profile."
            );
            break;
          }

          // The Employees module creates the full HR profile first,
          // then links the new employee back to this candidate.
          navigate("/hr/employees", {
            state: { candidate },
          });
          break;
        }
        case "reject":
          response = await api.patch(
            `/hr/candidates/${candidateId}/reject`
          );
          break;
      }

      console.log("Candidate action:", response?.data);
      showToast(
        action === "accept-offer"
          ? "Offer accepted successfully."
          : action === "join"
            ? "Candidate marked as joined."
            : "Candidate rejected successfully."
      );
      await loadCandidates();
    } catch (error: any) {
      console.error("Candidate action error:", error);
      showToast(
        error?.response?.data?.message ||
          "Failed to update candidate",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };
const updateCandidateStatus = async (
  candidateId: string,
  status: Candidate["status"]
) => {
  try {
    setActionLoading(`${candidateId}-status`);

await api.patch(
  `/hr/candidates/${candidateId}/status`,
  {
    status,
  }
);
    showToast(
      `Candidate status changed to ${formatStatus(status)}`
    );

    await loadCandidates();
  } catch (error: any) {
    console.error(
      "Candidate status update error:",
      error
    );

    showToast(
      error?.response?.data?.message ||
        "Failed to update candidate status",
      "error"
    );
  } finally {
    setActionLoading(null);
  }
};
  // ==========================================================
  // OVERVIEW COUNTS
  // ==========================================================

  const overview = {
    jobs: jobs.length,

    candidates:
      candidates.length,

    interviews:
      interviews.length,

    selected:
      candidates.filter(
        (item) =>
          item.status ===
          "selected"
      ).length,

    joined:
      candidates.filter(
        (item) =>
          item.status ===
          "joined"
      ).length,

    activeJobs:
      jobs.filter(
        (item) =>
          item.status ===
          "active"
      ).length,

    scheduledInterviews:
      interviews.filter(
        (item) =>
          item.status ===
          "scheduled"
      ).length,
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FE0000]" />
      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Sellopedia"
            className="h-10 w-auto object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Recruitment
            </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage jobs, candidates and interviews.
          </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              openScheduleModal()
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#FE0000] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <CalendarPlus className="h-4 w-4" />
            Schedule Interview
          </button>

        </div>
      </div>


      {/* ======================================================
          TABS
      ====================================================== */}

      <div className="overflow-x-auto border-b border-gray-200">

        <div className="flex min-w-max gap-6">

          {[
            {
              key: "overview",
              label: "Overview",
            },
            {
              key: "jobs",
              label: "Jobs",
            },
            {
              key: "candidates",
              label: "Candidates",
            },
            {
              key: "interviews",
              label: "Interviews",
            },
            {
              key: "documents",
              label: "Offer & Appointment Letters",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.key as Tab
                )
              }
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-[#FE0000] text-[#FE0000]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}

        </div>

      </div>


      {/* ======================================================
          SEARCH / FILTER
      ====================================================== */}

      {(activeTab === "candidates" ||
        activeTab === "interviews") && (
        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={
                activeTab ===
                "candidates"
                  ? "Search candidates..."
                  : "Search interviews..."
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
            />

          </div>


          {activeTab ===
            "candidates" && (
            <select
              value={
                candidateStatusFilter
              }
              onChange={(e) =>
                setCandidateStatusFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FE0000]"
            >
              <option value="all">
                All Status
              </option>

              <option value="applied">
                Applied
              </option>

              <option value="screening">
                Screening
              </option>

              <option value="interview">
                Interview
              </option>

              <option value="selected">
                Selected
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="joined">
                Joined
              </option>
            </select>
          )}


          {activeTab ===
            "interviews" && (
            <select
              value={
                interviewStatusFilter
              }
              onChange={(e) =>
                setInterviewStatusFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FE0000]"
            >
              <option value="all">
                All Status
              </option>

              <option value="scheduled">
                Scheduled
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="rescheduled">
                Rescheduled
              </option>
            </select>
          )}

        </div>
      )}


      {/* ======================================================
          OVERVIEW
      ====================================================== */}

      {activeTab === "overview" && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Active Jobs"
              value={
                overview.activeJobs
              }
              icon={
                <FileText className="h-5 w-5" />
              }
            />

            <StatCard
              title="Candidates"
              value={
                overview.candidates
              }
              icon={
                <UserRound className="h-5 w-5" />
              }
            />

            <StatCard
              title="Scheduled Interviews"
              value={
                overview.scheduledInterviews
              }
              icon={
                <Calendar className="h-5 w-5" />
              }
            />

            <StatCard
              title="Joined"
              value={
                overview.joined
              }
              icon={
                <UserCheck className="h-5 w-5" />
              }
            />

          </div>


          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* Recent Candidates */}

            <div className="rounded-xl border border-gray-200 bg-white">

              <div className="flex items-center justify-between border-b px-5 py-4">

                <h2 className="font-semibold text-gray-900">
                  Recent Candidates
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "candidates"
                    )
                  }
                  className="text-sm font-medium text-[#FE0000]"
                >
                  View all
                </button>

              </div>

              <div className="divide-y">

                {candidates
                  .slice(0, 5)
                  .map(
                    (candidate) => (
                      <div
                        key={
                          candidate._id
                        }
                        className="flex items-center justify-between gap-3 px-5 py-4"
                      >
                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium text-gray-900">
                            {
                              candidate.name
                            }
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {
                              candidate.email
                            }
                          </p>

                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getCandidateStatusClass(
                            candidate.status
                          )}`}
                        >
                          {
                            candidate.status
                          }
                        </span>

                      </div>
                    )
                  )}

                {!candidates.length && (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    No candidates found.
                  </div>
                )}

              </div>

            </div>


            {/* Upcoming Interviews */}

            <div className="rounded-xl border border-gray-200 bg-white">

              <div className="flex items-center justify-between border-b px-5 py-4">

                <h2 className="font-semibold text-gray-900">
                  Upcoming Interviews
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "interviews"
                    )
                  }
                  className="text-sm font-medium text-[#FE0000]"
                >
                  View all
                </button>

              </div>

              <div className="divide-y">

                {interviews
                  .filter(
                    (item) =>
                      item.status ===
                      "scheduled"
                  )
                  .slice(0, 5)
                  .map(
                    (interview) => (
                      <div
                        key={
                          interview._id
                        }
                        className="px-5 py-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <p className="text-sm font-medium text-gray-900">
                              {
                                interview
                                  .candidate
                                  ?.name ||
                                "Unknown Candidate"
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {
                                formatDateTime(
                                  interview.scheduledAt
                                )
                              }
                            </p>

                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getInterviewStatusClass(
                              interview.status
                            )}`}
                          >
                            Scheduled
                          </span>

                        </div>

                      </div>
                    )
                  )}

                {!interviews.filter(
                  (item) =>
                    item.status ===
                    "scheduled"
                ).length && (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    No scheduled interviews.
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}


      {/* ======================================================
          JOBS
      ====================================================== */}

      {activeTab === "jobs" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center justify-between border-b px-5 py-4">

            <div>
              <h2 className="font-semibold text-gray-900">
                Job Openings
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Manage current recruitment openings.
              </p>
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px] text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-5 py-3">
                    Position
                  </th>

                  <th className="px-5 py-3">
                    Department
                  </th>

                  <th className="px-5 py-3">
                    Location
                  </th>

                  <th className="px-5 py-3">
                    Employment
                  </th>

                  <th className="px-5 py-3">
                    Openings
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                                   <th className="px-5 py-3 text-right">
                     Actions
                   </th>

</tr>

              </thead>

              <tbody className="divide-y">

                {jobs.map(
                  (job) => (
                    <tr
                      key={
                        job._id
                      }
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => openJobDetails(job)}
                    >

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {
                          job.title
                        }
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          job.department
                            ?.name ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          job.location ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          job.employmentType ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          job.openings ??
                          0
                        }
                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          {
                            job.status ||
                            "active"
                          }
                        </span>

                      </td>

                    

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openJobDetails(job);
                          }}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View Details
                        </button>
                      </td></tr>
                  )
                )}

              </tbody>

            </table>

            {!jobs.length && (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No job openings found.
              </div>
            )}

          </div>

        </div>
      )}


      {/* ======================================================
          CANDIDATES
      ====================================================== */}

      {activeTab === "candidates" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-5 py-3">
                    Candidate
                  </th>

                  <th className="px-5 py-3">
                    Position
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Offer
                  </th>

                  <th className="px-5 py-3">
                    Applied
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {filteredCandidates.map(
                  (candidate) => (
                    <tr
                      key={
                        candidate._id
                      }
                      className="hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-[#FE0000]">
                            <UserRound className="h-4 w-4" />
                          </div>

                          <div>
                            <button
                               type="button"
                               onClick={() => openCandidateDetails(candidate)}
                               className="text-left"
                             >
                               <p className="font-medium text-gray-900 hover:text-[#FE0000]">
                                 {candidate.name}
                               </p>
                             </button>

                            <p className="text-xs text-gray-500">
                              {
                                candidate.email
                              }
                            </p>
                          </div>

                        </div>

                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          candidate
                            .jobOpening
                            ?.title ||
                          "—"
                        }
                      </td>

                    <td className="px-5 py-4">
  <div className="flex items-center gap-2">
    <select
      value={candidate.status}
      disabled={
        actionLoading ===
        `${candidate._id}-status`
      }
      onChange={(event) =>
        updateCandidateStatus(
          candidate._id,
          event.target.value as Candidate["status"]
        )
      }
      className={`rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none ring-1 ring-inset transition focus:ring-2 focus:ring-blue-500 ${getCandidateStatusClass(
        candidate.status
      )}`}
    >
      <option value="applied">
        Applied
      </option>

      <option value="screening">
        Screening
      </option>

      <option value="interview">
        Interview
      </option>

      <option value="selected">
        Selected
      </option>

      <option value="rejected">
        Rejected
      </option>

      <option value="joined">
        Joined
      </option>

      <option value="withdrawn">
        Withdrawn
      </option>
    </select>

    {actionLoading ===
      `${candidate._id}-status` && (
      <Loader2
        className="h-4 w-4 animate-spin text-[#FE0000]"
      />
    )}
  </div>
</td>

                      <td className="px-5 py-4">

                        <span className="text-xs text-gray-600">
                          {
                            candidate.offerStatus ||
                            "not generated"
                          }
                        </span>

                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {
                          formatDate(
                            candidate.createdAt
                          )
                        }
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          {candidate.status === "selected" && candidate.offerStatus === "not_generated" && (
                            <button type="button" onClick={() => openOfferModal(candidate)} disabled={actionLoading === `${candidate._id}-offer`} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                              <FileText className="h-3.5 w-3.5" />
                              {actionLoading === `${candidate._id}-offer` ? "Generating..." : "Generate Offer"}
                            </button>
                          )}
                          {candidate.offerStatus === "sent" && (
                            <button type="button" onClick={() => candidateAction(candidate._id, "accept-offer")} disabled={actionLoading === `${candidate._id}-accept-offer`} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Accept Offer</button>
                          )}
                          {candidate.offerStatus === "accepted" && candidate.status !== "joined" && (
                            <button type="button" onClick={() => candidateAction(candidate._id, "join")} disabled={actionLoading === `${candidate._id}-join`} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50">Convert to Employee</button>
                          )}
                          {candidate.status === "joined" && (
                            <button type="button" onClick={() => openAppointmentModal(candidate)} disabled={actionLoading === `${candidate._id}-appointment`} className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50">
                              <FileCheck className="h-3.5 w-3.5" />
                              {actionLoading === `${candidate._id}-appointment` ? "Generating..." : "Appointment Letter"}
                            </button>
                          )}
                          {(candidate.status === "applied" || candidate.status === "screening" || candidate.status === "interview") && (
                            <button type="button" onClick={() => openScheduleModal(candidate._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-blue-100">
                              <CalendarPlus className="h-3.5 w-3.5" /> Interview
                            </button>
                          )}
                          {candidate.status !== "rejected" && candidate.status !== "joined" && (
                            <button type="button" onClick={() => candidateAction(candidate._id, "reject")} disabled={actionLoading === `${candidate._id}-reject`} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">Reject</button>
                          )}
                          <button type="button" onClick={() => { setSelectedCandidate(candidate); setShowCandidateDetails(true); }} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50" title="View candidate">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {!filteredCandidates.length && (
            <div className="px-5 py-12 text-center text-sm text-gray-500">
              No candidates found.
            </div>
          )}

        </div>
      )}


      {/* ======================================================
          INTERVIEWS
      ====================================================== */}

      {activeTab === "interviews" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center">

            <div>
              <h2 className="font-semibold text-gray-900">
                Interviews
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Schedule and manage candidate interviews.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                openScheduleModal()
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FE0000] px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Schedule Interview
            </button>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px] text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-5 py-3">
                    Candidate
                  </th>

                  <th className="px-5 py-3">
                    Date & Time
                  </th>

                  <th className="px-5 py-3">
                    Type
                  </th>

                  <th className="px-5 py-3">
                    Interviewer
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y">

                {filteredInterviews.map(
                  (interview) => (
                    <tr
                      key={
                        interview._id
                      }
                      className="hover:bg-gray-50"
                    >

                      {/* Candidate */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-[#FE0000]">
                            <UserRound className="h-4 w-4" />
                          </div>

                          <div>

                            <p className="font-medium text-gray-900">
                              {
                                interview
                                  .candidate
                                  ?.name ||
                                "Unknown"
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              {
                                interview
                                  .candidate
                                  ?.email ||
                                ""
                              }
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* Date */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-gray-700">

                          <Clock className="h-4 w-4 text-gray-400" />

                          {
                            formatDateTime(
                              interview.scheduledAt
                            )
                          }

                        </div>

                      </td>


                      {/* Type */}

                      <td className="px-5 py-4">

                        {interview.type ===
                        "virtual" ? (
                          <div className="flex items-center gap-2 text-[#FE0000]">

                            <Video className="h-4 w-4" />

                            <span>
                              Virtual
                            </span>

                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-600">

                            <MapPin className="h-4 w-4" />

                            <span>
                              Physical
                            </span>

                          </div>
                        )}

                      </td>


                      {/* Interviewer */}

                      <td className="px-5 py-4 text-gray-600">
                        {
                          interview
                            .interviewer
                            ?.name ||
                          "Not assigned"
                        }
                      </td>


                      {/* Status */}

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getInterviewStatusClass(
                            interview.status
                          )}`}
                        >
                          {formatInterviewStatus(
                            interview.status
                          )}
                        </span>

                      </td>


                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInterview(
                                interview
                              );
                              setShowInterviewDetails(
                                true
                              );
                            }}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                            title="View interview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>


                          {interview.status ===
                            "scheduled" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateInterviewStatus(
                                    interview._id,
                                    "completed"
                                  )
                                }
                                disabled={
                                  updatingInterview ===
                                  interview._id
                                }
                                className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                              >
                                {updatingInterview ===
                                interview._id
                                  ? "..."
                                  : "Complete"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateInterviewStatus(
                                    interview._id,
                                    "cancelled"
                                  )
                                }
                                disabled={
                                  updatingInterview ===
                                  interview._id
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>


          {loadingInterviews && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#FE0000]" />
            </div>
          )}

          {!loadingInterviews &&
            !filteredInterviews.length && (
              <div className="px-5 py-12 text-center">

                <Calendar className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No interviews found
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Schedule an interview to see it here.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openScheduleModal()
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FE0000] px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Interview
                </button>

              </div>
            )}

        </div>
      )}


      {/* ======================================================
          OFFER & APPOINTMENT LETTERS
      ====================================================== */}

      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FE0000]">Recruitment Documents</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">Offer & Appointment Letters</h2>
                <p className="mt-1 text-sm text-gray-500">Generate employment documents directly from the recruitment pipeline.</p>
              </div>
              <div className="flex gap-2 text-xs font-medium">
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700">Offer Letter</span>
                <span className="rounded-full bg-purple-50 px-3 py-1.5 text-purple-700">Appointment Letter</span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <DocumentStageCard
              title="Offer Letters"
              description="Available after a candidate is selected."
              icon={<FileText className="h-5 w-5" />}
              color="indigo"
              candidates={candidates.filter((c) => c.status === "selected")}
              empty="No selected candidates are waiting for an offer."
              actionLabel="Generate Offer Letter"
              onAction={openOfferModal}
            />

            <DocumentStageCard
              title="Appointment Letters"
              description="Uses the selected joined candidate and its linked Employee HR Profile."
              icon={<FileCheck className="h-5 w-5" />}
              color="purple"
              candidates={candidates.filter((c) => c.status === "joined")}
              empty="No joined candidates are ready for an appointment letter."
              actionLabel="Generate Appointment Letter"
              onAction={openAppointmentModal}
            />
          </div>
        </div>
      )}

      {/* ======================================================
          OFFER LETTER MODAL
      ====================================================== */}

      {showOfferModal && offerCandidate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Employment Document</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">Generate Offer Letter</h2>
              </div>
              <button type="button" onClick={() => setShowOfferModal(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  Selected Candidate
                </p>
                <p className="mt-1 font-semibold text-indigo-950">
                  {offerCandidate.name}
                </p>
                <p className="mt-1 text-sm text-indigo-700">
                  {offerCandidate.email}
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                  {offerCandidate.jobOpening?.title || "Selected Candidate"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Designation" value={offerForm.designation} onChange={(value) => setOfferForm((p) => ({ ...p, designation: value }))} placeholder="e.g. Full Stack Developer" />
                <FormField label="Monthly Salary (₹)" type="number" value={offerForm.salary} onChange={(value) => setOfferForm((p) => ({ ...p, salary: value }))} placeholder="35000" />
              </div>
              <FormField label="Joining Date" type="date" value={offerForm.joiningDate} onChange={(value) => setOfferForm((p) => ({ ...p, joiningDate: value }))} />
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                This action generates the official Offer Letter through the HR document service and updates the candidate's offer status to <strong>Sent</strong>.
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={() => setShowOfferModal(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
                <button type="button" onClick={generateOfferLetter} disabled={actionLoading === `${offerCandidate._id}-offer`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  <FileText className="h-4 w-4" />
                  {actionLoading === `${offerCandidate._id}-offer` ? "Generating..." : "Generate & Send Offer Letter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          APPOINTMENT LETTER MODAL
      ====================================================== */}

      {showAppointmentModal && appointmentCandidate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Joining Document</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">Generate Appointment Letter</h2>
              </div>
              <button type="button" onClick={() => setShowAppointmentModal(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-purple-50 p-4">
                <p className="font-semibold text-purple-950">{appointmentCandidate.name}</p>
                <p className="mt-1 text-sm text-purple-700">Joined employee</p>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Selected Candidate
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-purple-600">Candidate</p>
                    <p className="font-semibold text-purple-950">
                      {appointmentCandidate.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">Email</p>
                    <p className="font-medium text-purple-900">
                      {appointmentCandidate.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Employee HR Profile
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {typeof appointmentCandidate.employee === "string"
                    ? appointmentCandidate.employee
                    : appointmentCandidate.employee?._id ||
                      "Linked automatically when the candidate is joined"}
                </p>
              </div>

              <FormField
                label="Joining Date"
                type="date"
                value={appointmentForm.joiningDate}
                onChange={(value) =>
                  setAppointmentForm((p) => ({
                    ...p,
                    joiningDate: value,
                  }))
                }
              />

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                The appointment letter uses the <strong>same selected candidate</strong>
                {" "}and the Employee HR Profile linked to that candidate. No Employee ID needs to be entered manually.
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={() => setShowAppointmentModal(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
                <button type="button" onClick={generateAppointmentLetter} disabled={actionLoading === `${appointmentCandidate._id}-appointment`} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  <FileCheck className="h-4 w-4" />
                  {actionLoading === `${appointmentCandidate._id}-appointment` ? "Generating..." : "Generate Appointment Letter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          SCHEDULE INTERVIEW MODAL
      ====================================================== */}

      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeScheduleModal();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Schedule Interview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the required interview details.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeScheduleModal
                }
                disabled={
                  savingInterview
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* Form */}

            <div className="space-y-5 px-6 py-6">

              {/* Candidate */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">

                  Candidate

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <select
                  value={
                    interviewForm.candidate
                  }
                  onChange={(event) =>
                    setInterviewForm(
                      (prev) => ({
                        ...prev,
                        candidate:
                          event.target
                            .value,
                      })
                    )
                  }
                  required
                  disabled={
                    savingInterview
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                >

                  <option value="">
                    Select candidate
                  </option>

                  {candidates
                    .filter(
                      (candidate) =>
                        candidate.status !==
                          "rejected" &&
                        candidate.status !==
                          "withdrawn" &&
                        candidate.status !==
                          "joined"
                    )
                    .map(
                      (candidate) => (
                        <option
                          key={
                            candidate._id
                          }
                          value={
                            candidate._id
                          }
                        >
                          {
                            candidate.name
                          }
                          {" — "}
                          {
                            candidate.email
                          }
                        </option>
                      )
                    )}

                </select>

              </div>


              {/* Date + Time */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">

                    Scheduled Date

                    <span className="ml-1 text-red-500">
                      *
                    </span>

                  </label>

                  <input
                    type="date"
                    value={
                      interviewForm.date
                    }
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(event) =>
                      setInterviewForm(
                        (prev) => ({
                          ...prev,
                          date:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                    disabled={
                      savingInterview
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">

                    Scheduled Time

                    <span className="ml-1 text-red-500">
                      *
                    </span>

                  </label>

                  <input
                    type="time"
                    value={
                      interviewForm.time
                    }
                    onChange={(event) =>
                      setInterviewForm(
                        (prev) => ({
                          ...prev,
                          time:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                    disabled={
                      savingInterview
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />

                </div>

              </div>


              {/* Type */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">

                  Interview Type

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <select
                  value={
                    interviewForm.type
                  }
                  onChange={(event) =>
                    setInterviewForm(
                      (prev) => ({
                        ...prev,

                        type:
                          event.target
                            .value as
                            | ""
                            | "virtual"
                            | "physical",

                        locationOrLink:
                          "",
                      })
                    )
                  }
                  required
                  disabled={
                    savingInterview
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                >

                  <option value="">
                    Select interview type
                  </option>

                  <option value="virtual">
                    Virtual
                  </option>

                  <option value="physical">
                    Physical
                  </option>

                </select>

              </div>


              {/* Virtual */}

              {interviewForm.type ===
                "virtual" && (
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Meeting Link
                  </label>

                  <input
                    type="url"
                    value={
                      interviewForm.locationOrLink
                    }
                    onChange={(event) =>
                      setInterviewForm(
                        (prev) => ({
                          ...prev,
                          locationOrLink:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="https://meet.google.com/..."
                    disabled={
                      savingInterview
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Add the Google Meet, Zoom, Teams or other meeting link.
                  </p>

                </div>
              )}


              {/* Physical */}

              {interviewForm.type ===
                "physical" && (
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Interview Location
                  </label>

                  <input
                    type="text"
                    value={
                      interviewForm.locationOrLink
                    }
                    onChange={(event) =>
                      setInterviewForm(
                        (prev) => ({
                          ...prev,
                          locationOrLink:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Office / Conference Room"
                    disabled={
                      savingInterview
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />

                </div>
              )}


              {/* Interviewer */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Interviewer User ID
                </label>

                <input
                  type="text"
                  value={
                    interviewForm.interviewer
                  }
                  onChange={(event) =>
                    setInterviewForm(
                      (prev) => ({
                        ...prev,
                        interviewer:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="MongoDB User ObjectId"
                  disabled={
                    savingInterview
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Leave empty if an interviewer has not been assigned.
                </p>

              </div>

            </div>


            {/* Footer */}

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">

              <button
                type="button"
                onClick={
                  closeScheduleModal
                }
                disabled={
                  savingInterview
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  scheduleInterview
                }
                disabled={
                  savingInterview
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#FE0000] px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {savingInterview ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4" />
                    Schedule Interview
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}



      {/* ======================================================
          JOB DETAILS / FULL EDIT MODAL
      ====================================================== */}

      {showJobDetails && selectedJob && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingJob) {
              setShowJobDetails(false);
              setEditingJob(false);
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#FE0000]">Job Opening</p>
                <h2 className="mt-1 truncate text-xl font-bold text-gray-900">
                  {editingJob ? "Edit Complete Job Details" : selectedJob.title}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {editingJob ? "All fields below are mapped to the JobOpening MongoDB schema." : "View and manage this recruitment opening."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (savingJob) return;
                  setShowJobDetails(false);
                  setEditingJob(false);
                }}
                disabled={savingJob}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(94vh-76px)] overflow-y-auto px-5 py-5 sm:px-6">
              {editingJob ? (
                <div className="space-y-7">
                  {/* BASIC */}
                  <section>
                    <SectionTitle title="Basic Information" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Job Title *" className="md:col-span-2">
                        <input value={jobEditForm.title} onChange={(e) => setJobEditForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="e.g. Senior Frontend Developer" />
                      </Field>
                      <Field label="Job Code">
                        <input value={jobEditForm.jobCode} onChange={(e) => setJobEditForm(p => ({ ...p, jobCode: e.target.value.toUpperCase() }))} className={inputClass} placeholder="e.g. FE-001" />
                      </Field>
                      <Field label="Location">
                        <input value={jobEditForm.location} onChange={(e) => setJobEditForm(p => ({ ...p, location: e.target.value }))} className={inputClass} placeholder="Bhubaneswar / Remote" />
                      </Field>
                      <Field label="Department">
                        <input value={selectedJob.department?.name || "—"} disabled className={`${inputClass} bg-gray-50`} />
                      </Field>
                      <Field label="Designation">
                        <input value={selectedJob.designation?.name || "—"} disabled className={`${inputClass} bg-gray-50`} />
                      </Field>
                      <Field label="Openings">
                        <input type="number" min={1} value={jobEditForm.openings} onChange={(e) => setJobEditForm(p => ({ ...p, openings: Math.max(1, Number(e.target.value) || 1) }))} className={inputClass} />
                      </Field>
                    </div>
                  </section>

                  {/* DESCRIPTION */}
                  <section>
                    <SectionTitle title="Job Description" />
                    <div className="space-y-4">
                      <Field label="Short Description">
                        <textarea rows={3} value={jobEditForm.shortDescription} onChange={(e) => setJobEditForm(p => ({ ...p, shortDescription: e.target.value }))} className={textareaClass} placeholder="Short summary shown in listings..." />
                      </Field>
                      <Field label="Full Description *">
                        <textarea rows={8} value={jobEditForm.description} onChange={(e) => setJobEditForm(p => ({ ...p, description: e.target.value }))} className={textareaClass} placeholder="Enter the complete job description..." />
                      </Field>
                    </div>
                  </section>

                  {/* REQUIREMENTS */}
                  <section>
                    <SectionTitle title="Responsibilities & Requirements" />
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <EditableStringList title="Responsibilities" items={jobEditForm.responsibilities} onChange={(items) => setJobEditForm(p => ({ ...p, responsibilities: items }))} />
                      <EditableStringList title="Requirements" items={jobEditForm.requirements} onChange={(items) => setJobEditForm(p => ({ ...p, requirements: items }))} />
                      <EditableStringList title="Qualifications" items={jobEditForm.qualifications} onChange={(items) => setJobEditForm(p => ({ ...p, qualifications: items }))} />
                      <EditableStringList title="Preferred Qualifications" items={jobEditForm.preferredQualifications} onChange={(items) => setJobEditForm(p => ({ ...p, preferredQualifications: items }))} />
                    </div>
                  </section>

                  {/* SKILLS */}
                  <section>
                    <SectionTitle title="Skills" action={<button type="button" onClick={() => setJobEditForm(p => ({ ...p, skills: [...p.skills, { name: "", level: "intermediate", required: true }] }))} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-blue-100"><Plus className="h-3.5 w-3.5" /> Add Skill</button>} />
                    <div className="space-y-3">
                      {jobEditForm.skills.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">No skills added.</p>}
                      {jobEditForm.skills.map((skill, index) => (
                        <div key={`skill-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_180px_120px_auto] md:items-end">
                          <Field label="Skill Name"><input value={skill.name} onChange={(e) => setJobEditForm(p => ({ ...p, skills: p.skills.map((s, i) => i === index ? { ...s, name: e.target.value } : s) }))} className={inputClass} placeholder="React, Node.js, Excel..." /></Field>
                          <Field label="Level"><select value={skill.level} onChange={(e) => setJobEditForm(p => ({ ...p, skills: p.skills.map((s, i) => i === index ? { ...s, level: e.target.value as JobSkill["level"] } : s) }))} className={selectClass}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></Field>
                          <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm"><input type="checkbox" checked={skill.required} onChange={(e) => setJobEditForm(p => ({ ...p, skills: p.skills.map((s, i) => i === index ? { ...s, required: e.target.checked } : s) }))} /> Required</label>
                          <button type="button" onClick={() => setJobEditForm(p => ({ ...p, skills: p.skills.filter((_, i) => i !== index) }))} className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">Remove</button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* EXPERIENCE / EDUCATION */}
                  <section>
                    <SectionTitle title="Experience & Education" />
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                        <h4 className="font-semibold text-gray-900">Experience</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Minimum Years"><input type="number" min={0} value={jobEditForm.minimumExperience} onChange={(e) => setJobEditForm(p => ({ ...p, minimumExperience: Math.max(0, Number(e.target.value) || 0) }))} className={inputClass} /></Field>
                          <Field label="Maximum Years"><input type="number" min={0} value={jobEditForm.maximumExperience} onChange={(e) => setJobEditForm(p => ({ ...p, maximumExperience: e.target.value }))} className={inputClass} placeholder="No limit" /></Field>
                        </div>
                        <Field label="Experience Description"><textarea rows={4} value={jobEditForm.experienceDescription} onChange={(e) => setJobEditForm(p => ({ ...p, experienceDescription: e.target.value }))} className={textareaClass} /></Field>
                      </div>
                      <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                        <h4 className="font-semibold text-gray-900">Education</h4>
                        <Field label="Minimum Qualification"><input value={jobEditForm.minimumQualification} onChange={(e) => setJobEditForm(p => ({ ...p, minimumQualification: e.target.value }))} className={inputClass} placeholder="B.Tech / MCA / Graduate" /></Field>
                        <Field label="Preferred Qualification"><input value={jobEditForm.preferredQualification} onChange={(e) => setJobEditForm(p => ({ ...p, preferredQualification: e.target.value }))} className={inputClass} /></Field>
                        <EditableStringList title="Fields" items={jobEditForm.educationFields} onChange={(items) => setJobEditForm(p => ({ ...p, educationFields: items }))} compact />
                      </div>
                    </div>
                  </section>

                  {/* EMPLOYMENT */}
                  <section>
                    <SectionTitle title="Employment Details" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <Field label="Employment Type"><select value={jobEditForm.employmentType} onChange={(e) => setJobEditForm(p => ({ ...p, employmentType: e.target.value as JobEditForm["employmentType"] }))} className={selectClass}><option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></Field>
                      <Field label="Work Mode"><select value={jobEditForm.workMode} onChange={(e) => setJobEditForm(p => ({ ...p, workMode: e.target.value as JobEditForm["workMode"] }))} className={selectClass}><option value="office">Office</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></Field>
                      <Field label="Status"><select value={jobEditForm.status} onChange={(e) => setJobEditForm(p => ({ ...p, status: e.target.value as JobEditForm["status"] }))} className={selectClass}><option value="draft">Draft</option><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option></select></Field>
                      <Field label="Closing Date"><input type="date" value={jobEditForm.closingDate} onChange={(e) => setJobEditForm(p => ({ ...p, closingDate: e.target.value }))} className={inputClass} /></Field>
                    </div>
                  </section>

                  {/* SALARY */}
                  <section>
                    <SectionTitle title="Salary" />
                    <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={jobEditForm.salaryDisclosed} onChange={(e) => setJobEditForm(p => ({ ...p, salaryDisclosed: e.target.checked }))} /> Disclose salary to candidates</label>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Field label="Minimum"><input type="number" min={0} disabled={!jobEditForm.salaryDisclosed} value={jobEditForm.salaryMinimum} onChange={(e) => setJobEditForm(p => ({ ...p, salaryMinimum: e.target.value }))} className={`${inputClass} disabled:bg-gray-50`} /></Field>
                        <Field label="Maximum"><input type="number" min={0} disabled={!jobEditForm.salaryDisclosed} value={jobEditForm.salaryMaximum} onChange={(e) => setJobEditForm(p => ({ ...p, salaryMaximum: e.target.value }))} className={`${inputClass} disabled:bg-gray-50`} /></Field>
                        <Field label="Currency"><input value={jobEditForm.salaryCurrency} onChange={(e) => setJobEditForm(p => ({ ...p, salaryCurrency: e.target.value.toUpperCase() }))} className={inputClass} /></Field>
                        <Field label="Period"><select value={jobEditForm.salaryPeriod} onChange={(e) => setJobEditForm(p => ({ ...p, salaryPeriod: e.target.value as JobEditForm["salaryPeriod"] }))} className={selectClass}><option value="hourly">Hourly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></Field>
                      </div>
                      <Field label="Salary Description"><textarea rows={3} value={jobEditForm.salaryDescription} onChange={(e) => setJobEditForm(p => ({ ...p, salaryDescription: e.target.value }))} className={textareaClass} placeholder="Negotiable, based on experience..." /></Field>
                    </div>
                  </section>

                  {/* BENEFITS / HIRING */}
                  <section>
                    <SectionTitle title="Benefits & Hiring Process" />
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <EditableStringList title="Benefits" items={jobEditForm.benefits} onChange={(items) => setJobEditForm(p => ({ ...p, benefits: items }))} />
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="mb-3 flex items-center justify-between"><h4 className="font-semibold text-gray-900">Hiring Process</h4><button type="button" onClick={() => setJobEditForm(p => ({ ...p, hiringProcess: [...p.hiringProcess, { title: "", description: "", order: p.hiringProcess.length + 1 }] }))} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"><Plus className="h-3.5 w-3.5" /> Add Stage</button></div>
                        <div className="space-y-3">
                          {jobEditForm.hiringProcess.length === 0 && <p className="text-sm text-gray-500">No hiring stages added.</p>}
                          {jobEditForm.hiringProcess.map((step, index) => <div key={`stage-${index}`} className="rounded-lg border border-gray-200 p-3"><div className="flex gap-2"><input value={step.title} onChange={(e) => setJobEditForm(p => ({ ...p, hiringProcess: p.hiringProcess.map((s, i) => i === index ? { ...s, title: e.target.value } : s) }))} className={`${inputClass} flex-1`} placeholder="Stage title" /><button type="button" onClick={() => setJobEditForm(p => ({ ...p, hiringProcess: p.hiringProcess.filter((_, i) => i !== index) }))} className="rounded-lg border border-red-200 px-3 text-sm text-red-600">Remove</button></div><textarea value={step.description || ""} onChange={(e) => setJobEditForm(p => ({ ...p, hiringProcess: p.hiringProcess.map((s, i) => i === index ? { ...s, description: e.target.value } : s) }))} className={`${textareaClass} mt-2`} rows={2} placeholder="Stage description" /></div>)}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* APPLICATION */}
                  <section>
                    <SectionTitle title="Application" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Application Email"><input type="email" value={jobEditForm.applicationEmail} onChange={(e) => setJobEditForm(p => ({ ...p, applicationEmail: e.target.value }))} className={inputClass} placeholder="hr@example.com" /></Field>
                      <Field label="Published Date"><input type="date" value={jobEditForm.publishedAt} onChange={(e) => setJobEditForm(p => ({ ...p, publishedAt: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Application Instructions" className="md:col-span-2"><textarea rows={4} value={jobEditForm.applicationInstructions} onChange={(e) => setJobEditForm(p => ({ ...p, applicationInstructions: e.target.value }))} className={textareaClass} /></Field>
                    </div>
                  </section>

                  {/* PUBLIC */}
                  <section>
                    <SectionTitle title="Shareable Job Description" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Public ID"><input value={jobEditForm.publicId} onChange={(e) => setJobEditForm(p => ({ ...p, publicId: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Public Slug"><input value={jobEditForm.publicSlug} onChange={(e) => setJobEditForm(p => ({ ...p, publicSlug: e.target.value.toLowerCase().replace(/\\s+/g, "-") }))} className={inputClass} /></Field>
                      <Field label="Public URL"><input value={jobEditForm.publicUrl} onChange={(e) => setJobEditForm(p => ({ ...p, publicUrl: e.target.value }))} className={inputClass} placeholder="https://..." /></Field>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700"><input type="checkbox" checked={jobEditForm.isPublic} onChange={(e) => setJobEditForm(p => ({ ...p, isPublic: e.target.checked }))} /> Publicly visible</label>
                    </div>
                  </section>

                  {/* NOTES */}
                  <section>
                    <SectionTitle title="Internal HR Notes" />
                    <textarea rows={4} value={jobEditForm.internalNotes} onChange={(e) => setJobEditForm(p => ({ ...p, internalNotes: e.target.value }))} className={textareaClass} placeholder="Internal notes visible only to HR..." />
                  </section>

                  <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t bg-white px-5 py-4 sm:-mx-6 sm:px-6">
                    <button type="button" onClick={resetJobEditForm} disabled={savingJob} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    <button type="button" onClick={saveJobDetails} disabled={savingJob} className="inline-flex items-center gap-2 rounded-lg bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {savingJob ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save All Changes</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailRow label="Job Code" value={selectedJob.jobCode || "—"} />
                    <DetailRow label="Department" value={selectedJob.department?.name || "—"} />
                    <DetailRow label="Designation" value={selectedJob.designation?.name || "—"} />
                    <DetailRow label="Location" value={selectedJob.location || "—"} />
                    <DetailRow label="Employment" value={formatStatus(selectedJob.employmentType)} />
                    <DetailRow label="Work Mode" value={formatStatus(selectedJob.workMode)} />
                    <DetailRow label="Openings" value={String(selectedJob.openings ?? 1)} />
                    <DetailRow label="Status" value={formatStatus(selectedJob.status)} />
                    <DetailRow label="Closing Date" value={formatDate(selectedJob.closingDate || undefined)} />
                    <DetailRow label="Created" value={formatDate(selectedJob.createdAt)} />
                  </div>

                  {selectedJob.shortDescription && <section className="rounded-xl bg-red-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#FE0000]">Short Description</p><p className="mt-2 text-sm leading-6 text-gray-700">{selectedJob.shortDescription}</p></section>}
                  <section className="rounded-xl border border-gray-200"><div className="border-b bg-gray-50 px-5 py-4"><h3 className="font-semibold text-gray-900">Job Description</h3></div><div className="whitespace-pre-wrap px-5 py-5 text-sm leading-7 text-gray-700">{selectedJob.description || "No job description has been added yet."}</div></section>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ReadList title="Responsibilities" items={selectedJob.responsibilities?.map(x => x.text) || []} />
                    <ReadList title="Requirements" items={selectedJob.requirements?.map(x => x.text) || []} />
                    <ReadList title="Qualifications" items={selectedJob.qualifications?.map(x => x.text) || []} />
                    <ReadList title="Preferred Qualifications" items={selectedJob.preferredQualifications?.map(x => x.text) || []} />
                  </div>

                  <section className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-900">Skills</h3><div className="mt-3 flex flex-wrap gap-2">{selectedJob.skills?.length ? selectedJob.skills.map((skill, i) => <span key={i} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">{skill.name} · {formatStatus(skill.level)}{skill.required ? " · Required" : ""}</span>) : <span className="text-sm text-gray-500">No skills added.</span>}</div></section>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-900">Experience & Education</h3><div className="mt-4 space-y-3 text-sm text-gray-700"><p><b>Experience:</b> {selectedJob.experience?.minimumYears ?? 0}{selectedJob.experience?.maximumYears != null ? ` - ${selectedJob.experience.maximumYears}` : "+"} years</p><p><b>Minimum Qualification:</b> {selectedJob.education?.minimumQualification || "—"}</p><p><b>Preferred Qualification:</b> {selectedJob.education?.preferredQualification || "—"}</p><p><b>Fields:</b> {selectedJob.education?.fields?.join(", ") || "—"}</p></div></section>
                    <section className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-900">Salary</h3><div className="mt-4 text-sm text-gray-700">{selectedJob.salary?.isDisclosed ? <><p><b>Range:</b> {selectedJob.salary.minimum ?? "—"} - {selectedJob.salary.maximum ?? "—"} {selectedJob.salary.currency || "INR"}</p><p><b>Period:</b> {formatStatus(selectedJob.salary.period)}</p></> : <p>Salary is not disclosed.</p>}{selectedJob.salary?.description && <p className="mt-2">{selectedJob.salary.description}</p>}</div></section>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ReadList title="Benefits" items={selectedJob.benefits || []} />
                    <ReadList title="Hiring Process" items={(selectedJob.hiringProcess || []).map(x => x.description ? `${x.title}: ${x.description}` : x.title)} />
                  </div>

                  <section className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-900">Application & Publishing</h3><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-gray-700"><p><b>Application Email:</b> {selectedJob.applicationEmail || "—"}</p><p><b>Published:</b> {formatDate(selectedJob.publishedAt || undefined)}</p><p><b>Public:</b> {selectedJob.isPublic ? "Yes" : "No"}</p><p><b>Public Slug:</b> {selectedJob.publicSlug || "—"}</p><p className="sm:col-span-2"><b>Instructions:</b> {selectedJob.applicationInstructions || "—"}</p></div></section>

                  {selectedJob.internalNotes && <section className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-semibold text-amber-900">Internal HR Notes</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">{selectedJob.internalNotes}</p></section>}

                  <div className="flex flex-wrap justify-between gap-2 border-t pt-5">
                    <button type="button" onClick={() => { setShowJobDetails(false); setActiveTab("candidates"); setSearch(selectedJob.title); }} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">View Candidates</button>
                    <button type="button" onClick={() => setEditingJob(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#FE0000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"><Pencil className="h-4 w-4" /> Edit Complete Job</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          CANDIDATE DETAILS MODAL
      ====================================================== */}

      {showCandidateDetails && selectedCandidate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCandidateDetails(false);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#FE0000]">
                  Candidate Profile
                </p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {selectedCandidate.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedCandidate.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCandidateDetails(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Full Name" value={selectedCandidate.name || "—"} />
                <DetailRow label="Email" value={selectedCandidate.email || "—"} />
                <DetailRow label="Phone" value={selectedCandidate.phone || "—"} />
                <DetailRow
                  label="Applied For"
                  value={selectedCandidate.jobOpening?.title || "General Application"}
                />
                <DetailRow label="Source" value={selectedCandidate.source || "—"} />
                <DetailRow label="Applied On" value={formatDate(selectedCandidate.createdAt)} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DetailRow label="Status" value={formatStatus(selectedCandidate.status)} />
                <DetailRow
                  label="Offer"
                  value={formatStatus(selectedCandidate.offerStatus || "not_generated")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-gray-200">
                  <div className="border-b bg-gray-50 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">Job Details</h3>
                  </div>
                  <div className="space-y-3 px-5 py-5">
                    {(() => {
                      const job = jobs.find(
                        (item) =>
                          item._id === selectedCandidate.jobOpening?._id
                      );
                      return (
                        <>
                          <DetailRow
                            label="Position"
                            value={
                              job?.title ||
                              selectedCandidate.jobOpening?.title ||
                              "—"
                            }
                          />
                          <DetailRow label="Location" value={job?.location || "—"} />
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Job Description
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                              {job?.description || "No job description available."}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200">
                  <div className="border-b bg-gray-50 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">Candidate Details</h3>
                  </div>
                  <div className="space-y-3 px-5 py-5">
                    <DetailRow
                      label="Education"
                      value={selectedCandidate.education || "Not provided"}
                    />
                    <DetailRow
                      label="Experience"
                      value={selectedCandidate.experience || "Not provided"}
                    />
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Notes
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {selectedCandidate.notes || "No candidate notes available."}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-5">
                {selectedCandidate.resumeUrl && (
                  <a
                    href={selectedCandidate.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" />
                    View Resume
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => openCandidateMail(selectedCandidate, "custom")}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Mail className="h-4 w-4" />
                  Email Candidate
                </button>

                <button
                  type="button"
                  onClick={() => openCandidateMail(selectedCandidate, "interview")}
                  className="rounded-lg border border-blue-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-blue-100"
                >
                  Interview Email
                </button>

                <button
                  type="button"
                  onClick={() => openCandidateMail(selectedCandidate, "selection")}
                  className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  Selection Email
                </button>

                <button
                  type="button"
                  onClick={() => openCandidateMail(selectedCandidate, "rejection")}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Rejection Email
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedCandidate.status === "selected" && selectedCandidate.offerStatus === "not_generated" && (
                  <button type="button" onClick={() => openOfferModal(selectedCandidate)} disabled={actionLoading === `${selectedCandidate._id}-offer`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                    <FileText className="h-4 w-4" /> Generate & Send Offer Letter
                  </button>
                )}
                {selectedCandidate.offerStatus === "sent" && (
                  <button type="button" onClick={() => candidateAction(selectedCandidate._id, "accept-offer")} disabled={actionLoading === `${selectedCandidate._id}-accept-offer`} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Accept Offer</button>
                )}
                {selectedCandidate.offerStatus === "accepted" && selectedCandidate.status !== "joined" && (
                  <button type="button" onClick={() => candidateAction(selectedCandidate._id, "join")} disabled={actionLoading === `${selectedCandidate._id}-join`} className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">Convert to Employee</button>
                )}
                {selectedCandidate.status === "joined" && (
                  <button type="button" onClick={() => openAppointmentModal(selectedCandidate)} disabled={actionLoading === `${selectedCandidate._id}-appointment`} className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50">
                    <FileCheck className="h-4 w-4" /> Generate Appointment Letter
                  </button>
                )}
                {(selectedCandidate.status === "applied" || selectedCandidate.status === "screening" || selectedCandidate.status === "interview") && (
                  <button type="button" onClick={() => { setShowCandidateDetails(false); openScheduleModal(selectedCandidate._id); }} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-blue-100">
                    <CalendarPlus className="h-4 w-4" /> Schedule Interview
                  </button>
                )}
                {selectedCandidate.status !== "rejected" && selectedCandidate.status !== "joined" && (
                  <button type="button" onClick={() => candidateAction(selectedCandidate._id, "reject")} disabled={actionLoading === `${selectedCandidate._id}-reject`} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">Reject Candidate</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          RECRUITMENT EMAIL MODAL
      ====================================================== */}

      {showMailModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !mailSending) {
              setShowMailModal(false);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Email Candidate
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Recruitment communication and mail options.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMailModal(false)}
                disabled={mailSending}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow
                  label="Candidate"
                  value={selectedCandidate?.name || "—"}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Template
                  </label>
                  <select
                    value={mailForm.template}
                    onChange={(event) =>
                      updateMailTemplate(event.target.value)
                    }
                    disabled={mailSending}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="custom">Custom Email</option>
                    <option value="screening">Application / Screening</option>
                    <option value="interview">Interview Invitation</option>
                    <option value="selection">Selection Update</option>
                    <option value="offer">Offer Update</option>
                    <option value="rejection">Rejection</option>
                  </select>
                </div>
              </div>

              {[
                ["To", "to", "candidate@email.com"],
                ["CC", "cc", "hr@company.com"],
                ["BCC", "bcc", "audit@company.com"],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={mailForm[key as keyof typeof mailForm] as string}
                    onChange={(event) =>
                      setMailForm((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder={placeholder}
                    disabled={mailSending}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={mailForm.subject}
                  onChange={(event) =>
                    setMailForm((prev) => ({
                      ...prev,
                      subject: event.target.value,
                    }))
                  }
                  disabled={mailSending}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={mailForm.message}
                  onChange={(event) =>
                    setMailForm((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                  rows={12}
                  disabled={mailSending}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm leading-6"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-red-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">Mail Options</p>
                <p className="mt-1">
                  Change recipient, CC, BCC, subject and message.
                  The email is linked to the candidate for HR tracking.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setShowMailModal(false)}
                  disabled={mailSending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendRecruitmentEmail}
                  disabled={mailSending}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {mailSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          INTERVIEW DETAILS MODAL
      ====================================================== */}

      {showInterviewDetails &&
        selectedInterview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowInterviewDetails(
                  false
                );
              }
            }}
          >

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b px-6 py-4">

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Interview Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Interview information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowInterviewDetails(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>


              <div className="space-y-4 px-6 py-6">

                <DetailRow
                  label="Candidate"
                  value={
                    selectedInterview
                      .candidate
                      ?.name ||
                    "—"
                  }
                />

                <DetailRow
                  label="Email"
                  value={
                    selectedInterview
                      .candidate
                      ?.email ||
                    "—"
                  }
                />

                <DetailRow
                  label="Date & Time"
                  value={formatDateTime(
                    selectedInterview.scheduledAt
                  )}
                />

                <DetailRow
                  label="Type"
                  value={
                    selectedInterview.type ===
                    "virtual"
                      ? "Virtual"
                      : "Physical"
                  }
                />

                <DetailRow
                  label={
                    selectedInterview.type ===
                    "virtual"
                      ? "Meeting Link"
                      : "Location"
                  }
                  value={
                    selectedInterview
                      .locationOrLink ||
                    "—"
                  }
                />

                <DetailRow
                  label="Interviewer"
                  value={
                    selectedInterview
                      .interviewer
                      ?.name ||
                    "Not assigned"
                  }
                />

                <DetailRow
                  label="Status"
                  value={formatInterviewStatus(
                    selectedInterview.status
                  )}
                />

                {selectedInterview.feedback && (
                  <DetailRow
                    label="Feedback"
                    value={
                      selectedInterview.feedback
                    }
                  />
                )}

                {selectedInterview.rating !==
                  undefined && (
                  <DetailRow
                    label="Rating"
                    value={`${selectedInterview.rating}/10`}
                  />
                )}

              </div>

            </div>

          </div>
        )}


    </div>
  );
};


// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>

        </div>

        <div className="rounded-lg bg-red-50 p-3 text-[#FE0000]">
          {icon}
        </div>

      </div>

    </div>
  );
};


// ============================================================
// DETAIL ROW
// ============================================================

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="rounded-lg bg-gray-50 p-3">

      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-gray-900">
        {value}
      </p>

    </div>
  );
};


const FormField = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100" />
  </label>
);

const DocumentStageCard = ({ title, description, icon, color, candidates, empty, actionLabel, onAction }: { title: string; description: string; icon: React.ReactNode; color: "indigo" | "purple"; candidates: Candidate[]; empty: string; actionLabel: string; onAction: (candidate: Candidate) => void }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className={`border-b px-5 py-4 ${color === "indigo" ? "bg-indigo-50/60" : "bg-purple-50/60"}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${color === "indigo" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"}`}>{icon}</div>
        <div><h3 className="font-bold text-gray-900">{title}</h3><p className="text-xs text-gray-500">{description}</p></div>
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {candidates.map((candidate) => (
        <div key={candidate._id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0"><p className="truncate font-semibold text-gray-900">{candidate.name}</p><p className="truncate text-xs text-gray-500">{candidate.email}</p><p className="mt-1 text-xs text-gray-400">{candidate.jobOpening?.title || "General"}</p></div>
          <button type="button" onClick={() => onAction(candidate)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white ${color === "indigo" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-purple-600 hover:bg-purple-700"}`}>{actionLabel}</button>
        </div>
      ))}
      {!candidates.length && <div className="px-5 py-10 text-center text-sm text-gray-500">{empty}</div>}
    </div>
  </div>
);

export default Recruitment;