import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <img
            src="/logo.png"
            alt="Sellopedia"
            className="h-11 w-auto object-contain"
          />

          <div className="hidden sm:block">
            <div className="text-lg font-bold leading-tight text-slate-900">
              Sellopedia
            </div>
            <div className="text-xs font-medium text-slate-500">
              Careers
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 transition hover:text-[#FE0000]"
          >
            Home
          </Link>

          <Link
            to="/jobs"
            className="text-sm font-medium text-slate-600 transition hover:text-[#FE0000]"
          >
            Open Positions
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link
            to="/jobs"
            className="inline-flex items-center rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md"
          >
            View Jobs
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-red-50 hover:text-[#FE0000] md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-sm md:hidden">
          <nav className="flex flex-col gap-1">

            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-[#FE0000]"
            >
              Home
            </Link>

            <Link
              to="/jobs"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-[#FE0000]"
            >
              Open Positions
            </Link>

            <Link
              to="/jobs"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-[#FE0000] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700"
            >
              View Jobs
            </Link>

          </nav>
        </div>
      )}
    </header>
  );
}