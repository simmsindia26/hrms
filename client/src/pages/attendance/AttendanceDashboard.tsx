import {
  CalendarCheck,
  Clock3,
  UserCheck,
  Users,
} from "lucide-react";

const stats = [
  {
    title: "Present Today",
    value: "0",
    icon: UserCheck,
  },
  {
    title: "Absent Today",
    value: "0",
    icon: Users,
  },
  {
    title: "Late Today",
    value: "0",
    icon: Clock3,
  },
  {
    title: "Total Employees",
    value: "0",
    icon: CalendarCheck,
  },
];

export default function AttendanceDashboard() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">
          Attendance Dashboard
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Overview of today's employee attendance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-gray-900">
                    {stat.value}
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Attendance */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="font-bold text-gray-900">
              Today's Attendance
            </h3>

            <p className="text-xs text-gray-500">
              Employee attendance status
            </p>
          </div>

          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Mark Attendance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-500">
                  Employee
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-500">
                  Check In
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-500">
                  Check Out
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-500">
                  Working Hours
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-gray-500"
                >
                  No attendance records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}