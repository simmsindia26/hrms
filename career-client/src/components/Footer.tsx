import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-12 w-auto object-contain"
              />

              <div>
                <div className="font-bold text-white">
                  Sellopedia
                </div>

                <div className="text-xs text-slate-400">
                  Careers
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
              Explore career opportunities and join a team
              where your skills, ideas and ambition can make
              an impact.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Quick Links
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <Link
                to="/"
                className="transition hover:text-[#FE0000]"
              >
                Home
              </Link>

              <Link
                to="/jobs"
                className="transition hover:text-[#FE0000]"
              >
                Open Positions
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Contact
            </h3>

            <div className="mt-4 space-y-4 text-sm text-slate-400">

              <a
                href="mailto:careers@sellopedia.in"
                className="flex gap-3 transition hover:text-white"
              >
                <Mail
                  size={17}
                  className="mt-0.5 shrink-0 text-[#FE0000]"
                />

                <span>
                  careers@sellopedia.in
                </span>
              </a>

              <div className="flex gap-3">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-[#FE0000]"
                />

                <span>
                  Odisha, India
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left">

          <p>
            © {new Date().getFullYear()} Sellopedia. All rights reserved.
          </p>

          <p>
            Careers at{" "}
            <span className="font-semibold text-[#FE0000]">
              Sellopedia
            </span>
          </p>

        </div>
      </div>
    </footer>
  );
}