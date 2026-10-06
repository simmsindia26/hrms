import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { getPublicJob } from "../api/careerApi";
import type { JobOpening } from "../types/career";

/* =========================================================
   HELPERS
========================================================= */

function formatEmploymentType(
  value: JobOpening["employmentType"]
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatWorkMode(
  value: JobOpening["workMode"]
) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatSalary(job: JobOpening) {
  if (!job.salary?.isDisclosed) {
    return "Salary not disclosed";
  }

  const currency =
    job.salary.currency || "INR";

  const formatter = new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );

  const minimum =
    job.salary.minimum != null
      ? formatter.format(
          job.salary.minimum
        )
      : null;

  const maximum =
    job.salary.maximum != null
      ? formatter.format(
          job.salary.maximum
        )
      : null;

  if (minimum && maximum) {
    return `${currency} ${minimum} - ${maximum} / ${job.salary.period}`;
  }

  if (minimum) {
    return `${currency} ${minimum}+ / ${job.salary.period}`;
  }

  return (
    job.salary.description ||
    "Salary disclosed during hiring"
  );
}

function formatDate(
  value?: string | null
) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

/* =========================================================
   SECTION COMPONENT
========================================================= */

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({
  title,
  children,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900">
        {title}
      </h2>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   JOB DETAILS PAGE
========================================================= */

export default function JobDetails() {
  const { slug } = useParams<{
    slug: string;
  }>();

  const navigate = useNavigate();

  const [job, setJob] =
    useState<JobOpening | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD JOB
  ======================================================= */

  useEffect(() => {
    const currentSlug: string =
      typeof slug === "string"
        ? slug
        : "";

    if (!currentSlug) {
      setError("Invalid job URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadJob() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPublicJob(
            currentSlug
          );

        if (!cancelled) {
          setJob(data);
        }
      } catch (loadError) {
        console.error(
          "Failed to load job:",
          loadError
        );

        if (!cancelled) {
          setError(
            "This job opening could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJob();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main>

          <section className="bg-slate-950">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

              <div className="h-5 w-24 animate-pulse rounded bg-slate-800" />

              <div className="mt-7 h-12 max-w-2xl animate-pulse rounded-lg bg-slate-800" />

              <div className="mt-5 h-6 max-w-xl animate-pulse rounded bg-slate-800" />

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-800" />
                <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-800" />
                <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-800" />
              </div>

            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">

              <div className="rounded-3xl border border-slate-200 bg-white p-8">

                <div className="space-y-5">
                  <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
                </div>

                <div className="mt-12 space-y-4">
                  <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
                </div>

              </div>

              <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />

            </div>
          </section>

        </main>
      </div>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50">

        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">

          <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#FE0000]">
              <Briefcase size={25} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Job Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "This position may have been removed or is no longer available."}
            </p>

            <Link
              to="/jobs"
              className="
                mt-7 inline-flex items-center gap-2
                rounded-xl bg-[#FE0000]
                px-5 py-3
                text-sm font-semibold text-white
                transition
                hover:bg-red-700
              "
            >
              <ArrowLeft size={17} />
              Back to Jobs
            </Link>

          </div>

        </main>

      </div>
    );
  }

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const closingDate = formatDate(
    job.closingDate
  );

  const minimumExperience =
    job.experience?.minimumYears ?? 0;

  const maximumExperience =
    job.experience?.maximumYears ?? null;

  const experienceText =
    maximumExperience !== null
      ? `${minimumExperience} - ${maximumExperience} years`
      : `${minimumExperience}+ years`;

  const sortedHiringProcess = [
    ...(job.hiringProcess || []),
  ].sort(
    (a, b) =>
      (a.order ?? 0) -
      (b.order ?? 0)
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden bg-slate-950">

          {/* Red background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(254,0,0,0.25),transparent_40%)]" />

          <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-[#FE0000]/10 blur-3xl" />

          <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-red-900/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
                inline-flex items-center gap-2
                text-sm font-medium
                text-slate-400
                transition
                hover:text-[#FE0000]
              "
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="mt-8 max-w-4xl">

              {/* BADGES */}

              <div className="flex flex-wrap items-center gap-2">

                {job.jobCode && (
                  <span className="rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300">
                    {job.jobCode}
                  </span>
                )}

                {job.department?.name && (
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">
                    {job.department.name}
                  </span>
                )}

                {job.designation?.name && (
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">
                    {job.designation.name}
                  </span>
                )}

              </div>

              {/* TITLE */}

              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {job.title}
              </h1>

              {/* SHORT DESCRIPTION */}

              {job.shortDescription && (
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                  {job.shortDescription}
                </p>
              )}

              {/* META */}

              <div className="mt-8 flex flex-wrap gap-3">

                <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <MapPin
                    size={17}
                    className="text-[#FE0000]"
                  />
                  {job.location ||
                    "Location not specified"}
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <Briefcase
                    size={17}
                    className="text-[#FE0000]"
                  />
                  {formatEmploymentType(
                    job.employmentType
                  )}
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <Clock3
                    size={17}
                    className="text-[#FE0000]"
                  />
                  {formatWorkMode(
                    job.workMode
                  )}
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <Users
                    size={17}
                    className="text-[#FE0000]"
                  />
                  {job.openings} opening
                  {job.openings !== 1
                    ? "s"
                    : ""}
                </div>

              </div>

            </div>
          </div>
        </section>


        {/* =================================================
            CONTENT
        ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <div className="space-y-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">

              {/* ABOUT */}

              <Section title="About the Role">
                <div className="whitespace-pre-line text-[15px] leading-7 text-slate-600">
                  {job.description}
                </div>
              </Section>


              {/* RESPONSIBILITIES */}

              {job.responsibilities?.length > 0 && (
                <Section title="Responsibilities">

                  <ul className="space-y-3">

                    {job.responsibilities.map(
                      (item, index) => (
                        <li
                          key={`${item.text}-${index}`}
                          className="flex gap-3 text-[15px] leading-7 text-slate-600"
                        >
                          <CheckCircle2
                            size={19}
                            className="mt-1 shrink-0 text-[#FE0000]"
                          />

                          <span>
                            {item.text}
                          </span>
                        </li>
                      )
                    )}

                  </ul>

                </Section>
              )}


              {/* REQUIREMENTS */}

              {job.requirements?.length > 0 && (
                <Section title="Requirements">

                  <ul className="space-y-3">

                    {job.requirements.map(
                      (item, index) => (
                        <li
                          key={`${item.text}-${index}`}
                          className="flex gap-3 text-[15px] leading-7 text-slate-600"
                        >
                          <CheckCircle2
                            size={19}
                            className="mt-1 shrink-0 text-[#FE0000]"
                          />

                          <span>
                            {item.text}
                          </span>
                        </li>
                      )
                    )}

                  </ul>

                </Section>
              )}


              {/* QUALIFICATIONS */}

              {job.qualifications?.length > 0 && (
                <Section title="Qualifications">

                  <ul className="space-y-3">

                    {job.qualifications.map(
                      (item, index) => (
                        <li
                          key={`${item.text}-${index}`}
                          className="flex gap-3 text-[15px] leading-7 text-slate-600"
                        >
                          <GraduationCap
                            size={19}
                            className="mt-1 shrink-0 text-[#FE0000]"
                          />

                          <span>
                            {item.text}
                          </span>
                        </li>
                      )
                    )}

                  </ul>

                </Section>
              )}


              {/* PREFERRED QUALIFICATIONS */}

              {job.preferredQualifications
                ?.length > 0 && (
                <Section title="Preferred Qualifications">

                  <ul className="space-y-3">

                    {job.preferredQualifications.map(
                      (item, index) => (
                        <li
                          key={`${item.text}-${index}`}
                          className="flex gap-3 text-[15px] leading-7 text-slate-600"
                        >
                          <CheckCircle2
                            size={19}
                            className="mt-1 shrink-0 text-[#FE0000]"
                          />

                          <span>
                            {item.text}
                          </span>
                        </li>
                      )
                    )}

                  </ul>

                </Section>
              )}


              {/* SKILLS */}

              {job.skills?.length > 0 && (
                <Section title="Skills">

                  <div className="flex flex-wrap gap-2.5">

                    {job.skills.map(
                      (skill, index) => (
                        <span
                          key={`${skill.name}-${index}`}
                          className={`
                            rounded-xl px-3.5 py-2
                            text-sm font-medium
                            ${
                              skill.required
                                ? "bg-red-50 text-[#FE0000]"
                                : "bg-slate-100 text-slate-600"
                            }
                          `}
                        >
                          {skill.name}

                          {!skill.required && (
                            <span className="ml-1 text-xs opacity-70">
                              Preferred
                            </span>
                          )}
                        </span>
                      )
                    )}

                  </div>

                </Section>
              )}


              {/* EDUCATION */}

              {(job.education
                ?.minimumQualification ||
                job.education
                  ?.preferredQualification ||
                (job.education?.fields?.length ??
                  0) > 0) && (

                <Section title="Education">

                  <div className="rounded-2xl bg-slate-50 p-5">

                    {job.education
                      ?.minimumQualification && (
                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Minimum Qualification
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {
                            job.education
                              .minimumQualification
                          }
                        </p>

                      </div>
                    )}


                    {job.education
                      ?.preferredQualification && (
                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Preferred Qualification
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {
                            job.education
                              .preferredQualification
                          }
                        </p>

                      </div>
                    )}


                    {(
                      job.education?.fields ||
                      []
                    ).length > 0 && (

                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Preferred Fields
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          {(
                            job.education
                              ?.fields || []
                          ).map(
                            (field) => (
                              <span
                                key={field}
                                className="
                                  rounded-lg
                                  bg-white
                                  px-3 py-1.5
                                  text-sm text-slate-600
                                  shadow-sm
                                  ring-1 ring-slate-200
                                "
                              >
                                {field}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}

                  </div>

                </Section>
              )}


              {/* EXPERIENCE */}

              <Section title="Experience">

                <div className="rounded-2xl bg-slate-50 p-5">

                  <p className="text-lg font-bold text-slate-900">
                    {experienceText}
                  </p>

                  {job.experience
                    ?.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {
                        job.experience
                          .description
                      }
                    </p>
                  )}

                </div>

              </Section>


              {/* BENEFITS */}

              {job.benefits?.length > 0 && (
                <Section title="Benefits">

                  <div className="grid gap-3 sm:grid-cols-2">

                    {job.benefits.map(
                      (benefit, index) => (
                        <div
                          key={`${benefit}-${index}`}
                          className="
                            flex gap-3
                            rounded-xl
                            border border-slate-200
                            p-4
                            transition
                            hover:border-red-100
                            hover:bg-red-50/30
                          "
                        >

                          <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-[#FE0000]"
                          />

                          <span className="text-sm leading-6 text-slate-600">
                            {benefit}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </Section>
              )}


              {/* HIRING PROCESS */}

              {sortedHiringProcess.length > 0 && (
                <Section title="Hiring Process">

                  <div className="space-y-5">

                    {sortedHiringProcess.map(
                      (stage, index) => (
                        <div
                          key={`${stage.title}-${index}`}
                          className="flex gap-4"
                        >

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FE0000] text-sm font-bold text-white shadow-sm">
                            {index + 1}
                          </div>

                          <div className="pt-1">

                            <h3 className="font-semibold text-slate-900">
                              {stage.title}
                            </h3>

                            {stage.description && (
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                {
                                  stage.description
                                }
                              </p>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </Section>
              )}


              {/* APPLICATION INSTRUCTIONS */}

              {job.applicationInstructions && (
                <Section title="Application Instructions">

                  <div className="
                    whitespace-pre-line
                    rounded-2xl
                    border border-red-100
                    bg-red-50
                    p-5
                    text-sm
                    leading-7
                    text-red-900
                  ">
                    {
                      job.applicationInstructions
                    }
                  </div>

                </Section>
              )}

            </div>


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="space-y-5">

              {/* APPLY CARD */}

              <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                  <Briefcase size={20} />
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  Ready to apply?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Submit your application for this
                  position through our Career Portal.
                </p>

                <Link
                  to={`/jobs/${job.publicSlug}/apply`}
                  className="
                    mt-6 flex w-full
                    items-center justify-center gap-2
                    rounded-xl
                    bg-[#FE0000]
                    px-5 py-3.5
                    text-sm font-bold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-red-700
                    hover:shadow-md
                  "
                >
                  Apply Now
                  <ArrowRight size={18} />
                </Link>


                {/* DEADLINE */}

                {closingDate && (
                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5">

                    <CalendarDays
                      size={18}
                      className="mt-0.5 shrink-0 text-[#FE0000]"
                    />

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Application Deadline
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {closingDate}
                      </p>

                    </div>

                  </div>
                )}


                {/* WORK MODE */}

                <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5">

                  <Clock3
                    size={18}
                    className="mt-0.5 shrink-0 text-[#FE0000]"
                  />

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Work Mode
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatWorkMode(
                        job.workMode
                      )}
                    </p>

                  </div>

                </div>


                {/* EMPLOYMENT */}

                <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5">

                  <Briefcase
                    size={18}
                    className="mt-0.5 shrink-0 text-[#FE0000]"
                  />

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Employment
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatEmploymentType(
                        job.employmentType
                      )}
                    </p>

                  </div>

                </div>


                {/* LOCATION */}

                {job.location && (
                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5">

                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-[#FE0000]"
                    />

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Location
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {job.location}
                      </p>

                    </div>

                  </div>
                )}

              </div>


              {/* COMPENSATION */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                  <Briefcase size={18} />
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Compensation
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatSalary(job)}
                </p>

                {job.salary
                  ?.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      job.salary
                        .description
                    }
                  </p>
                )}

              </div>


              {/* DESIGNATION */}

              {job.designation?.name && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Designation
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {job.designation.name}
                  </p>

                </div>
              )}

            </aside>

          </div>

        </section>

      </main>

    </div>
  );
}