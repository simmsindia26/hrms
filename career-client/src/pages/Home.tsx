import {
  ArrowRight,
  BriefcaseBusiness,
  Users,
  Rocket,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main>

        {/* =========================
            HERO SECTION
        ========================== */}
        <section className="relative overflow-hidden bg-slate-950">

          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(254,0,0,0.22),transparent_38%)]" />

          <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-[#FE0000]/10 blur-3xl" />

          <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-red-900/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">

            <div className="max-w-3xl">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300">
                <Rocket size={16} />
                Build your career with us
              </div>

              {/* Heading */}
              <h1 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                Find work that

                <span className="block text-[#FE0000]">
                  moves you forward.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Discover open positions, explore opportunities
                that match your skills, and take the next step
                in your career.
              </p>

              {/* Buttons */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <Link
                  to="/jobs"
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-xl bg-[#FE0000]
                    px-6 py-3.5
                    text-sm font-bold text-white
                    shadow-lg shadow-red-900/20
                    transition duration-200
                    hover:bg-red-700
                    hover:shadow-xl hover:shadow-red-900/30
                  "
                >
                  Explore Open Positions
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#why-us"
                  className="
                    inline-flex items-center justify-center
                    rounded-xl border border-slate-700
                    px-6 py-3.5
                    text-sm font-semibold text-slate-200
                    transition duration-200
                    hover:border-red-500/40
                    hover:bg-red-500/5
                    hover:text-white
                  "
                >
                  Why Join Us?
                </a>

              </div>
            </div>
          </div>
        </section>


        {/* =========================
            WHY SELLopedia
        ========================== */}
        <section
          id="why-us"
          className="bg-slate-50 py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* Section Heading */}
            <div className="max-w-2xl">

              <p className="text-sm font-bold uppercase tracking-wider text-[#FE0000]">
                Why Sellopedia
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Grow with a team that values people.
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                We believe great work comes from people who
                have the freedom to learn, contribute and
                take ownership.
              </p>

            </div>


            {/* Feature Cards */}
            <div className="mt-12 grid gap-6 md:grid-cols-3">

              {/* Great People */}
              <div
                className="
                  group rounded-2xl border border-slate-200
                  bg-white p-7
                  transition duration-200
                  hover:-translate-y-1
                  hover:border-red-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-11 w-11 items-center
                    justify-center rounded-xl
                    bg-red-50 text-[#FE0000]
                    transition duration-200
                    group-hover:bg-[#FE0000]
                    group-hover:text-white
                  "
                >
                  <Users size={21} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Great People
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Work alongside talented people and learn
                  from different perspectives.
                </p>
              </div>


              {/* Real Growth */}
              <div
                className="
                  group rounded-2xl border border-slate-200
                  bg-white p-7
                  transition duration-200
                  hover:-translate-y-1
                  hover:border-red-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-11 w-11 items-center
                    justify-center rounded-xl
                    bg-red-50 text-[#FE0000]
                    transition duration-200
                    group-hover:bg-[#FE0000]
                    group-hover:text-white
                  "
                >
                  <Rocket size={21} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Real Growth
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Take ownership of meaningful projects and
                  develop your skills through real experience.
                </p>
              </div>


              {/* Meaningful Work */}
              <div
                className="
                  group rounded-2xl border border-slate-200
                  bg-white p-7
                  transition duration-200
                  hover:-translate-y-1
                  hover:border-red-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-11 w-11 items-center
                    justify-center rounded-xl
                    bg-red-50 text-[#FE0000]
                    transition duration-200
                    group-hover:bg-[#FE0000]
                    group-hover:text-white
                  "
                >
                  <BriefcaseBusiness size={21} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Meaningful Work
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Work on products and services that create
                  practical value for businesses and people.
                </p>
              </div>

            </div>
          </div>
        </section>


        {/* =========================
            CTA SECTION
        ========================== */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">

            {/* Icon */}
            <div
              className="
                mx-auto flex h-14 w-14
                items-center justify-center
                rounded-2xl bg-red-50
                text-[#FE0000]
              "
            >
              <Search size={26} />
            </div>

            {/* Heading */}
            <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">
              Ready for your next opportunity?
            </h2>

            {/* Description */}
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-500">
              Browse our current openings and find a role
              where you can make an impact.
            </p>

            {/* CTA */}
            <Link
              to="/jobs"
              className="
                mt-8 inline-flex items-center gap-2
                rounded-xl bg-[#FE0000]
                px-6 py-3.5
                text-sm font-bold text-white
                shadow-sm
                transition duration-200
                hover:bg-red-700
                hover:shadow-md
              "
            >
              Browse Jobs
              <ArrowRight size={18} />
            </Link>

          </div>
        </section>

      </main>
    </div>
  );
}