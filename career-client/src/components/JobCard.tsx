import {
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { JobOpening } from "../types/career";

interface JobCardProps {
  job: JobOpening;
}

function formatEmploymentType(
  value: JobOpening["employmentType"]
) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatWorkMode(
  value: JobOpening["workMode"]
) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function JobCard({
  job,
}: JobCardProps) {
  return (
    <article
      className="
        group rounded-2xl border border-slate-200 bg-white p-6
        shadow-sm transition duration-200
        hover:-translate-y-1
        hover:border-red-200
        hover:shadow-lg
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div
          className="
            flex h-12 w-12 shrink-0 items-center
            justify-center rounded-xl
            bg-red-50 text-[#FE0000]
            transition duration-200
            group-hover:bg-[#FE0000]
            group-hover:text-white
          "
        >
          <Briefcase size={22} />
        </div>

        {job.jobCode && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {job.jobCode}
          </span>
        )}
      </div>

      {/* Job Information */}
      <div className="mt-5">
        <h3
          className="
            text-xl font-bold text-slate-900
            transition
            group-hover:text-[#FE0000]
          "
        >
          {job.title}
        </h3>

        {job.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {job.shortDescription}
          </p>
        )}
      </div>

      {/* Job Tags */}
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <Briefcase size={14} className="text-[#FE0000]" />
          {formatEmploymentType(job.employmentType)}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          {formatWorkMode(job.workMode)}
        </span>

        {job.location && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            <MapPin
              size={14}
              className="text-[#FE0000]"
            />
            {job.location}
          </span>
        )}
      </div>

      {/* Department */}
      {job.department && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Building2
            size={15}
            className="text-[#FE0000]"
          />
          {job.department.name}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <div>
          <p className="text-xs text-slate-400">
            Experience
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {job.experience.minimumYears}
            {job.experience.maximumYears !== null
              ? ` - ${job.experience.maximumYears}`
              : "+"}{" "}
            years
          </p>
        </div>

        <Link
          to={`/jobs/${job.publicSlug}`}
          className="
            inline-flex items-center gap-2
            rounded-xl bg-[#FE0000]
            px-4 py-2.5
            text-sm font-semibold text-white
            shadow-sm
            transition duration-200
            hover:bg-red-700
            hover:shadow-md
          "
        >
          View Job
          <ArrowRight
            size={16}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}