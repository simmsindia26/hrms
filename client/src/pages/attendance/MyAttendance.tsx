import { CalendarDays, Clock3 } from "lucide-react";

export default function MyAttendance() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">
          My Attendance
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          View your attendance and working hours.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Clock3 size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Today's Status
              </p>

              <h3 className="mt-1 text-xl font-bold">
                Not Checked In
              </h3>
            </div>
          </div>

          <button className="mt-6 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700">
            Check In
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CalendarDays size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Current Month
              </p>

              <h3 className="mt-1 text-xl font-bold">
                Attendance Summary
              </h3>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="text-xl font-black">0</div>
              <div className="text-xs text-gray-500">Present</div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="text-xl font-black">0</div>
              <div className="text-xs text-gray-500">Absent</div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="text-xl font-black">0</div>
              <div className="text-xs text-gray-500">Late</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}