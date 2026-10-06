import {
  Search,
  SlidersHorizontal,
  BriefcaseBusiness,
  X,
  RefreshCw,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import JobCard from "../components/JobCard";

import { getPublicJobs } from "../api/careerApi";
import type { JobOpening } from "../types/career";

export default function Jobs() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("all");

  /* =========================================
     FETCH JOBS
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        setLoading(true);
        setError("");

        const data = await getPublicJobs();

        if (!cancelled) {
          setJobs(data);
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);

        if (!cancelled) {
          setError("Unable to load current job openings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================
     FILTER JOBS
  ========================================= */

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.shortDescription
          ?.toLowerCase()
          .includes(query) ||
        job.location
          ?.toLowerCase()
          .includes(query) ||
        job.department?.name
          ?.toLowerCase()
          .includes(query) ||
        job.jobCode
          ?.toLowerCase()
          .includes(query);

      const matchesMode =
        workMode === "all" ||
        job.workMode === workMode;

      return matchesSearch && matchesMode;
    });
  }, [jobs, search, workMode]);

  /* =========================================
     CLEAR FILTERS
  ========================================= */

  const clearFilters = () => {
    setSearch("");
    setWorkMode("all");
  };

  const hasActiveFilters =
    search.trim() !== "" || workMode !== "all";

  return (
    <div className="min-h-screen bg-slate-50">
      <main>

        {/* =========================================
            HERO SECTION
        ========================================= */}

        <section className="relative overflow-hidden bg-slate-950">

          {/* Background Glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(254,0,0,0.22),transparent_40%)]" />

          <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-[#FE0000]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">

            {/* Label */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300">
              <BriefcaseBusiness size={16} />
              Careers at Sellopedia
            </div>

            {/* Heading */}
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Explore Our{" "}
              <span className="text-[#FE0000]">
                Open Positions
              </span>
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Discover exciting career opportunities at
              Sellopedia. Find a role that matches your
              skills, explore new challenges, and grow
              your career with us.
            </p>

            {/* Job Count */}
            {!loading && !error && (
              <div className="mt-7 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FE0000]/15 text-[#FE0000]">
                  <BriefcaseBusiness size={19} />
                </div>

                <div>
                  <p className="text-lg font-bold text-white">
                    {jobs.length}
                  </p>

                  <p className="text-xs text-slate-400">
                    Available Positions
                  </p>
                </div>

              </div>
            )}

          </div>
        </section>

        {/* =========================================
            JOB SEARCH AND FILTERS
        ========================================= */}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

              {/* SEARCH INPUT */}
              <div className="relative flex-1">

                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search jobs, departments, locations..."
                  aria-label="Search job openings"
                  className="
                    h-12 w-full rounded-xl
                    border border-slate-200
                    bg-slate-50
                    pl-11 pr-4
                    text-sm text-slate-700
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-[#FE0000]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-red-100
                  "
                />

              </div>

              {/* WORK MODE FILTER */}
              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                  <SlidersHorizontal size={19} />
                </div>

                <select
                  value={workMode}
                  onChange={(event) =>
                    setWorkMode(event.target.value)
                  }
                  aria-label="Filter by work mode"
                  className="
                    h-12 min-w-0 flex-1
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4
                    text-sm font-medium
                    text-slate-700
                    outline-none
                    transition
                    focus:border-[#FE0000]
                    focus:ring-2
                    focus:ring-red-100
                    lg:min-w-[190px]
                  "
                >
                  <option value="all">
                    All Work Modes
                  </option>

                  <option value="office">
                    Office
                  </option>

                  <option value="hybrid">
                    Hybrid
                  </option>

                  <option value="remote">
                    Remote
                  </option>
                </select>

              </div>

              {/* CLEAR FILTERS */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    inline-flex h-12 items-center
                    justify-center gap-2
                    rounded-xl
                    border border-red-100
                    bg-red-50
                    px-4
                    text-sm font-semibold
                    text-[#FE0000]
                    transition
                    hover:bg-red-100
                  "
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}

            </div>
          </div>

          {/* =========================================
              RESULTS HEADER
          ========================================= */}

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Available Opportunities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {loading ? (
                  "Loading opportunities..."
                ) : error ? (
                  "Unable to retrieve positions"
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-bold text-[#FE0000]">
                      {filteredJobs.length}
                    </span>{" "}
                    position
                    {filteredJobs.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>

            {!loading && !error && jobs.length > 0 && (
              <div className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-[#FE0000]">
                {jobs.length} Total Openings
              </div>
            )}

          </div>

          {/* =========================================
              LOADING SKELETON
          ========================================= */}

          {loading && (
            <div className="grid gap-6 pt-6 md:grid-cols-2 lg:grid-cols-3">

              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="
                      h-80 animate-pulse
                      rounded-2xl
                      border border-slate-200
                      bg-white p-6
                    "
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-200" />

                    <div className="mt-6 h-6 w-3/4 rounded bg-slate-200" />

                    <div className="mt-4 h-4 w-full rounded bg-slate-100" />

                    <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />

                    <div className="mt-6 flex gap-2">
                      <div className="h-8 w-20 rounded-lg bg-slate-100" />
                      <div className="h-8 w-24 rounded-lg bg-slate-100" />
                    </div>

                    <div className="mt-8 h-10 w-full rounded-xl bg-slate-100" />
                  </div>
                )
              )}

            </div>
          )}

          {/* =========================================
              ERROR STATE
          ========================================= */}

          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-[#FE0000]">
                <RefreshCw size={25} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Unable to Load Jobs
              </h3>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="
                  mt-6 inline-flex items-center
                  justify-center gap-2
                  rounded-xl bg-[#FE0000]
                  px-5 py-3
                  text-sm font-semibold text-white
                  transition
                  hover:bg-red-700
                "
              >
                <RefreshCw size={16} />
                Try Again
              </button>

            </div>
          )}

          {/* =========================================
              EMPTY STATE
          ========================================= */}

          {!loading &&
            !error &&
            filteredJobs.length === 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#FE0000]">
                  <Search size={30} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  {jobs.length === 0
                    ? "No Open Positions Right Now"
                    : "No Positions Found"}
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                  {jobs.length === 0
                    ? "There are currently no open positions available. Please check back later for new opportunities."
                    : "We couldn't find any jobs matching your search. Try adjusting your keywords or work mode."}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      mt-6 inline-flex items-center gap-2
                      rounded-xl bg-[#FE0000]
                      px-6 py-3
                      text-sm font-semibold text-white
                      transition
                      hover:bg-red-700
                    "
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                )}

              </div>
            )}

          {/* =========================================
              JOB CARDS
          ========================================= */}

          {!loading &&
            !error &&
            filteredJobs.length > 0 && (
              <div className="grid gap-6 pt-6 md:grid-cols-2 lg:grid-cols-3">

                {filteredJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                  />
                ))}

              </div>
            )}

        </section>
      </main>
    </div>
  );
}