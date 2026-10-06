import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  User,
  BriefcaseBusiness,
  GraduationCap,
  Link as LinkIcon,
  Send,
} from "lucide-react";

import {
  applyForJob,
  getPublicJob,
} from "../api/careerApi";

import type {
  JobOpening,
  JobApplicationPayload,
  ApplicationEducation,
  ApplicationExperience,
} from "../types/career";

/* =========================================================
   CONSTANTS
========================================================= */

const emptyEducation: ApplicationEducation = {
  qualification: "",
  institution: "",
  field: "",
  passingYear: "",
  percentage: "",
};

const emptyExperience: ApplicationExperience = {
  company: "",
  designation: "",
  startDate: "",
  endDate: "",
  description: "",
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ApplyJob() {
  const { slug } = useParams<{
    slug: string;
  }>();

  const navigate = useNavigate();

  const [job, setJob] =
    useState<JobOpening | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [applicationNumber, setApplicationNumber] =
    useState("");

  /* =======================================================
     PERSONAL DETAILS
  ======================================================= */

  const [personalDetails, setPersonalDetails] =
    useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      currentLocation: "",
      address: "",
      city: "",
      state: "",
      country: "India",
    });

  /* =======================================================
     PROFESSIONAL DETAILS
  ======================================================= */

  const [professionalDetails, setProfessionalDetails] =
    useState({
      currentCompany: "",
      currentDesignation: "",
      totalExperience: "",
      currentSalary: "",
      expectedSalary: "",
      noticePeriod: "",
    });

  /* =======================================================
     EDUCATION
  ======================================================= */

  const [education, setEducation] =
    useState<ApplicationEducation[]>([
      { ...emptyEducation },
    ]);

  /* =======================================================
     EXPERIENCE
  ======================================================= */

  const [experience, setExperience] =
    useState<ApplicationExperience[]>([
      { ...emptyExperience },
    ]);

  /* =======================================================
     LINKS
  ======================================================= */

  const [links, setLinks] = useState({
    linkedin: "",
    github: "",
    portfolio: "",
    other: "",
  });

  /* =======================================================
     SKILLS
  ======================================================= */

  const [skills, setSkills] =
    useState<string[]>([]);

  const [skillInput, setSkillInput] =
    useState("");

  /* =======================================================
     COVER LETTER / CONSENT
  ======================================================= */

  const [coverLetter, setCoverLetter] =
    useState("");

  const [consent, setConsent] =
    useState(false);

  /* =========================================================
     LOAD JOB
  ========================================================= */

  useEffect(() => {
    async function loadJob() {
      if (!slug) {
        setError("Invalid job URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getPublicJob(slug);

        setJob(data);
      } catch (err: any) {
        console.error(
          "Failed to load job:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load this job."
        );
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [slug]);

  /* =========================================================
     UPDATE PERSONAL
  ========================================================= */

  function updatePersonal(
    field: keyof typeof personalDetails,
    value: string
  ) {
    setPersonalDetails((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =========================================================
     UPDATE PROFESSIONAL
  ========================================================= */

  function updateProfessional(
    field: keyof typeof professionalDetails,
    value: string
  ) {
    setProfessionalDetails((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =========================================================
     UPDATE EDUCATION
  ========================================================= */

  function updateEducation(
    index: number,
    field: keyof ApplicationEducation,
    value: string
  ) {
    setEducation((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  /* =========================================================
     UPDATE EXPERIENCE
  ========================================================= */

  function updateExperience(
    index: number,
    field: keyof ApplicationExperience,
    value: string
  ) {
    setExperience((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  /* =========================================================
     SKILLS
  ========================================================= */

  function addSkill() {
    const value = skillInput.trim();

    if (!value) return;

    if (
      !skills.some(
        (skill) =>
          skill.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      setSkills((current) => [
        ...current,
        value,
      ]);
    }

    setSkillInput("");
  }

  function removeSkill(index: number) {
    setSkills((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =========================================================
     EDUCATION
  ========================================================= */

  function addEducation() {
    setEducation((current) => [
      ...current,
      { ...emptyEducation },
    ]);
  }

  function removeEducation(index: number) {
    setEducation((current) =>
      current.length === 1
        ? current
        : current.filter(
            (_, itemIndex) =>
              itemIndex !== index
          )
    );
  }

  /* =========================================================
     EXPERIENCE
  ========================================================= */

  function addExperience() {
    setExperience((current) => [
      ...current,
      { ...emptyExperience },
    ]);
  }

  function removeExperience(index: number) {
    setExperience((current) =>
      current.length === 1
        ? current
        : current.filter(
            (_, itemIndex) =>
              itemIndex !== index
          )
    );
  }

  /* =========================================================
     SUBMIT APPLICATION
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!slug) {
      setError("Invalid job URL.");
      return;
    }

    if (!personalDetails.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!personalDetails.email.trim()) {
      setError(
        "Email address is required."
      );
      return;
    }

    if (!personalDetails.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!consent) {
      setError(
        "Please accept the declaration before submitting."
      );
      return;
    }

    const payload: JobApplicationPayload = {
      personalDetails,
      professionalDetails,
      education,
      experience,
      links,
      coverLetter,
      skills,
      consent: consent === true,
    };

    try {
      setSubmitting(true);

      const result = await applyForJob(
        slug,
        payload
      );

      setApplicationNumber(
        result?.applicationNumber || ""
      );

      setSuccess(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err: any) {
      console.error(
        "Application submission failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to submit your application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FE0000]" />

          <p className="text-sm font-medium text-slate-500">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     JOB LOAD ERROR
  ========================================================= */

  if (error && !job) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-20">

        <div className="mx-auto w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#FE0000]">
            <BriefcaseBusiness size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Unable to Load Job
          </h1>

          <p className="mt-3 font-medium text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="
              mt-7 inline-flex items-center
              gap-2 rounded-xl
              bg-[#FE0000]
              px-5 py-3
              text-sm font-bold
              text-white
              transition
              hover:bg-red-700
            "
          >
            <ArrowLeft size={17} />
            View Jobs
          </button>

        </div>

      </main>
    );
  }

  if (!job) return null;

  /* =========================================================
     SUCCESS
  ========================================================= */

  if (success) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">

        <div className="mx-auto max-w-2xl">

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <CheckCircle2
                size={44}
                className="text-[#FE0000]"
              />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#FE0000]">
              Application Submitted
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Your application is on its way.
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              Thank you for applying for{" "}
              <strong className="text-slate-900">
                {job.title}
              </strong>
              . Our recruitment team will review
              your application.
            </p>

            {applicationNumber && (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5">

                <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Application Number
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {applicationNumber}
                </p>

              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="
                  rounded-xl
                  bg-[#FE0000]
                  px-6 py-3
                  text-sm font-bold
                  text-white
                  transition
                  hover:bg-red-700
                "
              >
                Browse More Jobs
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="
                  rounded-xl
                  border border-slate-200
                  px-6 py-3
                  text-sm font-bold
                  text-slate-700
                  transition
                  hover:border-red-200
                  hover:bg-red-50
                  hover:text-[#FE0000]
                "
              >
                Back Home
              </button>

            </div>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     APPLICATION FORM
  ========================================================= */

  return (
    <main className="bg-slate-50">

      {/* =====================================================
          APPLICATION HEADER
      ===================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">

        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-red-50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/jobs/${job.publicSlug}`
              )
            }
            className="
              mb-6 inline-flex
              items-center gap-2
              text-sm font-semibold
              text-slate-500
              transition
              hover:text-[#FE0000]
            "
          >
            <ArrowLeft size={16} />
            Back to Job
          </button>

          <div>

            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#FE0000]">
              <BriefcaseBusiness size={16} />
              Apply for this position
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {job.title}
            </h1>

            <p className="mt-3 text-slate-600">
              {job.location || "India"} ·{" "}
              {formatEmploymentType(
                job.employmentType
              )}
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
      >

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">

            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#FE0000]" />

            <span>{error}</span>

          </div>
        )}


        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* =================================================
              MAIN FORM
          ================================================= */}

          <div className="space-y-6">

            {/* PERSONAL INFORMATION */}

            <FormSection
              icon={<User size={19} />}
              title="Personal Information"
              description="Tell us how we can contact you."
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <Input
                  label="First Name"
                  required
                  value={
                    personalDetails.firstName
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "firstName",
                      value
                    )
                  }
                />

                <Input
                  label="Last Name"
                  value={
                    personalDetails.lastName
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "lastName",
                      value
                    )
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  required
                  value={
                    personalDetails.email
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "email",
                      value
                    )
                  }
                />

                <Input
                  label="Phone"
                  required
                  value={
                    personalDetails.phone
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "phone",
                      value
                    )
                  }
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={
                    personalDetails.dateOfBirth
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "dateOfBirth",
                      value
                    )
                  }
                />

                <Select
                  label="Gender"
                  value={
                    personalDetails.gender
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "gender",
                      value
                    )
                  }
                  options={[
                    {
                      value: "",
                      label: "Select Gender",
                    },
                    {
                      value: "male",
                      label: "Male",
                    },
                    {
                      value: "female",
                      label: "Female",
                    },
                    {
                      value: "other",
                      label: "Other",
                    },
                    {
                      value: "prefer_not_to_say",
                      label: "Prefer not to say",
                    },
                  ]}
                />

                <Input
                  label="Current Location"
                  value={
                    personalDetails.currentLocation
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "currentLocation",
                      value
                    )
                  }
                />

                <Input
                  label="City"
                  value={
                    personalDetails.city
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "city",
                      value
                    )
                  }
                />

                <Input
                  label="State"
                  value={
                    personalDetails.state
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "state",
                      value
                    )
                  }
                />

                <Input
                  label="Country"
                  value={
                    personalDetails.country
                  }
                  onChange={(value) =>
                    updatePersonal(
                      "country",
                      value
                    )
                  }
                />

                <div className="sm:col-span-2">
                  <Textarea
                    label="Address"
                    value={
                      personalDetails.address
                    }
                    onChange={(value) =>
                      updatePersonal(
                        "address",
                        value
                      )
                    }
                  />
                </div>

              </div>

            </FormSection>


            {/* PROFESSIONAL INFORMATION */}

            <FormSection
              icon={
                <BriefcaseBusiness size={19} />
              }
              title="Professional Information"
              description="Share your current career details."
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <Input
                  label="Current Company"
                  value={
                    professionalDetails.currentCompany
                  }
                  onChange={(value) =>
                    updateProfessional(
                      "currentCompany",
                      value
                    )
                  }
                />

                <Input
                  label="Current Designation"
                  value={
                    professionalDetails.currentDesignation
                  }
                  onChange={(value) =>
                    updateProfessional(
                      "currentDesignation",
                      value
                    )
                  }
                />

                <Input
                  label="Total Experience"
                  placeholder="e.g. 3 years"
                  value={
                    professionalDetails.totalExperience
                  }
                  onChange={(value) =>
                    updateProfessional(
                      "totalExperience",
                      value
                    )
                  }
                />

                <Input
                  label="Current Salary"
                  placeholder="e.g. ₹5 LPA"
                  value={
                    professionalDetails.currentSalary
                  }
                  onChange={(value) =>
                    updateProfessional(
                      "currentSalary",
                      value
                    )
                  }
                />

                <Input
                  label="Expected Salary"
                  placeholder="e.g. ₹7 LPA"
                  value={
                    professionalDetails.expectedSalary
                  }
                  onChange={(value) =>
                    updateProfessional(
                      "expectedSalary",
                      value
                    )
                  }
                />

                <Input
                  label="Notice Period"
                  placeholder="e.g. 30 days"
                  value={
                    professionalDetails.noticePeriod
                  }
                  onChange={(value) =>
                    updateProfessional(
                      "noticePeriod",
                      value
                    )
                  }
                />

              </div>

            </FormSection>


            {/* EDUCATION */}

            <FormSection
              icon={
                <GraduationCap size={19} />
              }
              title="Education"
              description="Add your educational qualifications."
              action={
                <button
                  type="button"
                  onClick={addEducation}
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-lg
                    bg-[#FE0000]
                    px-3 py-2
                    text-xs font-bold
                    text-white
                    transition
                    hover:bg-red-700
                  "
                >
                  <Plus size={14} />
                  Add
                </button>
              }
            >

              <div className="space-y-4">

                {education.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="
                        rounded-2xl
                        border border-slate-200
                        bg-slate-50/50
                        p-4
                      "
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <p className="text-sm font-bold text-slate-800">
                          Qualification{" "}
                          {index + 1}
                        </p>

                        {education.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeEducation(
                                index
                              )
                            }
                            className="
                              rounded-lg p-2
                              text-slate-400
                              transition
                              hover:bg-red-50
                              hover:text-[#FE0000]
                            "
                            aria-label="Remove education"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">

                        <Input
                          label="Qualification"
                          value={
                            item.qualification ||
                            ""
                          }
                          onChange={(value) =>
                            updateEducation(
                              index,
                              "qualification",
                              value
                            )
                          }
                        />

                        <Input
                          label="Institution"
                          value={
                            item.institution ||
                            ""
                          }
                          onChange={(value) =>
                            updateEducation(
                              index,
                              "institution",
                              value
                            )
                          }
                        />

                        <Input
                          label="Field / Specialization"
                          value={
                            item.field || ""
                          }
                          onChange={(value) =>
                            updateEducation(
                              index,
                              "field",
                              value
                            )
                          }
                        />

                        <Input
                          label="Passing Year"
                          value={
                            item.passingYear ||
                            ""
                          }
                          onChange={(value) =>
                            updateEducation(
                              index,
                              "passingYear",
                              value
                            )
                          }
                        />

                        <Input
                          label="Percentage / CGPA"
                          value={
                            item.percentage ||
                            ""
                          }
                          onChange={(value) =>
                            updateEducation(
                              index,
                              "percentage",
                              value
                            )
                          }
                        />

                      </div>

                    </div>
                  )
                )}

              </div>

            </FormSection>


            {/* EXPERIENCE */}

            <FormSection
              icon={
                <BriefcaseBusiness size={19} />
              }
              title="Work Experience"
              description="Add your previous work experience."
              action={
                <button
                  type="button"
                  onClick={addExperience}
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-lg
                    bg-[#FE0000]
                    px-3 py-2
                    text-xs font-bold
                    text-white
                    transition
                    hover:bg-red-700
                  "
                >
                  <Plus size={14} />
                  Add
                </button>
              }
            >

              <div className="space-y-4">

                {experience.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="
                        rounded-2xl
                        border border-slate-200
                        bg-slate-50/50
                        p-4
                      "
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <p className="text-sm font-bold text-slate-800">
                          Experience{" "}
                          {index + 1}
                        </p>

                        {experience.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeExperience(
                                index
                              )
                            }
                            className="
                              rounded-lg p-2
                              text-slate-400
                              transition
                              hover:bg-red-50
                              hover:text-[#FE0000]
                            "
                            aria-label="Remove experience"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">

                        <Input
                          label="Company"
                          value={
                            item.company || ""
                          }
                          onChange={(value) =>
                            updateExperience(
                              index,
                              "company",
                              value
                            )
                          }
                        />

                        <Input
                          label="Designation"
                          value={
                            item.designation ||
                            ""
                          }
                          onChange={(value) =>
                            updateExperience(
                              index,
                              "designation",
                              value
                            )
                          }
                        />

                        <Input
                          label="Start Date"
                          type="date"
                          value={
                            item.startDate ||
                            ""
                          }
                          onChange={(value) =>
                            updateExperience(
                              index,
                              "startDate",
                              value
                            )
                          }
                        />

                        <Input
                          label="End Date"
                          type="date"
                          value={
                            item.endDate || ""
                          }
                          onChange={(value) =>
                            updateExperience(
                              index,
                              "endDate",
                              value
                            )
                          }
                        />

                        <div className="sm:col-span-2">
                          <Textarea
                            label="Description"
                            value={
                              item.description ||
                              ""
                            }
                            onChange={(value) =>
                              updateExperience(
                                index,
                                "description",
                                value
                              )
                            }
                          />
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </FormSection>


            {/* PROFESSIONAL LINKS */}

            <FormSection
              icon={<LinkIcon size={19} />}
              title="Professional Links"
              description="Add links to your professional profiles."
            >

              <div className="grid gap-4">

                <Input
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/..."
                  value={links.linkedin}
                  onChange={(value) =>
                    setLinks((current) => ({
                      ...current,
                      linkedin: value,
                    }))
                  }
                />

                <Input
                  label="GitHub"
                  placeholder="https://github.com/..."
                  value={links.github}
                  onChange={(value) =>
                    setLinks((current) => ({
                      ...current,
                      github: value,
                    }))
                  }
                />

                <Input
                  label="Portfolio"
                  placeholder="https://..."
                  value={links.portfolio}
                  onChange={(value) =>
                    setLinks((current) => ({
                      ...current,
                      portfolio: value,
                    }))
                  }
                />

                <Input
                  label="Other Link"
                  placeholder="https://..."
                  value={links.other}
                  onChange={(value) =>
                    setLinks((current) => ({
                      ...current,
                      other: value,
                    }))
                  }
                />

              </div>

            </FormSection>


            {/* SKILLS */}

            <FormSection
              icon={<FileText size={19} />}
              title="Skills"
              description="Add your relevant skills."
            >

              <div className="flex gap-2">

                <input
                  value={skillInput}
                  onChange={(event) =>
                    setSkillInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="
                    h-11 flex-1
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4
                    text-sm
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-[#FE0000]
                    focus:ring-2
                    focus:ring-red-100
                  "
                />

                <button
                  type="button"
                  onClick={addSkill}
                  className="
                    flex h-11 w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#FE0000]
                    text-white
                    transition
                    hover:bg-red-700
                  "
                  aria-label="Add skill"
                >
                  <Plus size={18} />
                </button>

              </div>

              {skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">

                  {skills.map(
                    (skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="
                          inline-flex
                          items-center gap-2
                          rounded-full
                          bg-red-50
                          px-3 py-1.5
                          text-sm font-medium
                          text-[#FE0000]
                        "
                      >
                        {skill}

                        <button
                          type="button"
                          onClick={() =>
                            removeSkill(index)
                          }
                          className="
                            text-red-400
                            transition
                            hover:text-red-700
                          "
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}

                </div>
              )}

            </FormSection>


            {/* COVER LETTER */}

            <FormSection
              icon={<FileText size={19} />}
              title="Cover Letter"
              description="Tell us why you are interested in this position."
            >

              <Textarea
                label="Cover Letter"
                rows={8}
                value={coverLetter}
                onChange={setCoverLetter}
                placeholder="Write your cover letter..."
              />

            </FormSection>


            {/* CONSENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <label className="flex cursor-pointer gap-3">

                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) =>
                    setConsent(
                      event.target.checked
                    )
                  }
                  className="
                    mt-1 h-4 w-4
                    rounded
                    border-slate-300
                    accent-[#FE0000]
                  "
                />

                <span className="text-sm leading-6 text-slate-600">
                  I confirm that the information
                  provided in this application is
                  accurate and complete. I understand
                  that any false information may result
                  in rejection of my application.
                </span>

              </label>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={submitting}
              className="
                flex w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#FE0000]
                px-6 py-4
                text-sm font-black
                text-white
                shadow-sm
                transition
                hover:bg-red-700
                hover:shadow-md
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Submit Application
                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </div>


          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="h-fit space-y-5 lg:sticky lg:top-24">

            {/* JOB SUMMARY */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <BriefcaseBusiness size={20} />
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Applying For
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                {job.title}
              </h2>

              {job.location && (
                <p className="mt-2 text-sm text-slate-500">
                  {job.location}
                </p>
              )}

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">

                <SummaryItem
                  label="Employment"
                  value={formatEmploymentType(
                    job.employmentType
                  )}
                />

                <SummaryItem
                  label="Work Mode"
                  value={formatWorkMode(
                    job.workMode
                  )}
                />

                <SummaryItem
                  label="Openings"
                  value={String(
                    job.openings || 1
                  )}
                />

                <SummaryItem
                  label="Experience"
                  value={formatExperience(
                    job
                  )}
                />

              </div>

            </div>


            {/* APPLICATION INSTRUCTIONS */}

            {job.applicationInstructions && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

                <div className="flex items-center gap-2 text-[#FE0000]">
                  <FileText size={18} />

                  <h3 className="font-bold">
                    Application Instructions
                  </h3>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-red-900">
                  {
                    job.applicationInstructions
                  }
                </p>

              </div>
            )}

          </aside>

        </div>

      </form>

    </main>
  );
}


/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

      <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">

        <div className="flex gap-3">

          <div className="
            flex h-10 w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-red-50
            text-[#FE0000]
          ">
            {icon}
          </div>

          <div>

            <h2 className="font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>

          </div>

        </div>

        {action}

      </div>

      {children}

    </section>
  );
}


/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-bold text-slate-600">

        {label}

        {required && (
          <span className="ml-1 text-[#FE0000]">
            *
          </span>
        )}

      </span>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          h-11 w-full
          rounded-xl
          border border-slate-200
          bg-white
          px-3.5
          text-sm text-slate-900
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-[#FE0000]
          focus:ring-2
          focus:ring-red-100
        "
      />

    </label>
  );
}


/* =========================================================
   TEXTAREA
========================================================= */

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          w-full
          resize-y
          rounded-xl
          border border-slate-200
          bg-white
          px-3.5 py-3
          text-sm
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-[#FE0000]
          focus:ring-2
          focus:ring-red-100
        "
      />

    </label>
  );
}


/* =========================================================
   SELECT
========================================================= */

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          h-11 w-full
          rounded-xl
          border border-slate-200
          bg-white
          px-3.5
          text-sm
          outline-none
          transition
          focus:border-[#FE0000]
          focus:ring-2
          focus:ring-red-100
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

    </label>
  );
}


/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-semibold text-slate-800">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   FORMAT EMPLOYMENT TYPE
========================================================= */

function formatEmploymentType(
  value?: string
) {
  if (!value) return "—";

  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}


/* =========================================================
   FORMAT WORK MODE
========================================================= */

function formatWorkMode(
  value?: string
) {
  if (!value) return "—";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


/* =========================================================
   FORMAT EXPERIENCE
========================================================= */

function formatExperience(
  job: JobOpening
) {
  const minimum =
    job.experience?.minimumYears ?? 0;

  const maximum =
    job.experience?.maximumYears;

  if (
    maximum !== null &&
    maximum !== undefined
  ) {
    return `${minimum}–${maximum} years`;
  }

  if (minimum > 0) {
    return `${minimum}+ years`;
  }

  return "Fresher / Any";
}