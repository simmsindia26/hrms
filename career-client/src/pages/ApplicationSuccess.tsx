import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  BriefcaseBusiness,
  Home,
} from "lucide-react";

interface SuccessState {
  applicationNumber?: string;
  jobTitle?: string;
}

export default function ApplicationSuccess() {
  const location = useLocation();

  const state =
    (location.state as SuccessState | null) || {};

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">

          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <CheckCircle2
              size={44}
              className="text-[#FE0000]"
            />
          </div>

          {/* Status */}
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#FE0000]">
            Application Submitted
          </p>

          {/* Heading */}
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Thank you for applying.
          </h1>

          {/* Description */}
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Your application has been successfully received.
            Our recruitment team will review your profile and
            contact you if your application moves forward.
          </p>

          {/* Application Number */}
          {state.applicationNumber && (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-red-100 bg-red-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Application Number
              </p>

              <p className="mt-2 text-xl font-black text-slate-900">
                {state.applicationNumber}
              </p>

              {state.jobTitle && (
                <p className="mt-2 text-sm text-slate-500">
                  Applied for{" "}
                  <span className="font-semibold text-slate-700">
                    {state.jobTitle}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            {/* Browse Jobs */}
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md"
            >
              <BriefcaseBusiness size={17} />

              Browse More Jobs

              <ArrowRight size={16} />
            </Link>

            {/* Home */}
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#FE0000]"
            >
              <Home size={17} />

              Back Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}