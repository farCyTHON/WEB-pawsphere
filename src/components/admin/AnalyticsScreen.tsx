import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Calendar, ClipboardList, PawPrint } from 'lucide-react'

import { useAdminReports, useAdminStats } from '@/hooks/useAdmin'

import {
  AdminEmptyState,
  AdminPageTitle,
  AdminSkeleton,
  AdminStatCard,
} from './ui'

export function AdminAnalyticsScreen() {
  const {
    data: report,
    loading: reportLoading,
    error: reportError,
  } = useAdminReports()
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
  } = useAdminStats()

  const chartData = report.petsPerMonth
  const hasChartData = chartData.some(
    (row) => row.pets > 0 || row.applications > 0 || row.appointments > 0,
  )

  return (
    <div>
      <AdminPageTitle
        title="Reports & Analytics"
        subtitle="Platform-wide metrics and insights"
      />

      {(statsLoading || reportLoading) && (
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[14px] border border-[#E5E7EB] bg-white p-5"
            >
              <AdminSkeleton className="mb-4 h-5 w-40" />
              <AdminSkeleton className="h-[220px] w-full" />
            </div>
          ))}
        </div>
      )}

      {(statsError || reportError) && (
        <p className="mb-5 text-sm text-red-600" role="alert">
          {statsError || reportError}
        </p>
      )}

      {!statsLoading && !reportLoading && !statsError && !reportError && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminStatCard
              label="Total Pets"
              value={stats.totalPets}
              icon={<PawPrint size={16} />}
              color="green"
            />
            <AdminStatCard
              label="Total Applications"
              value={stats.totalApplications}
              icon={<ClipboardList size={16} />}
              color="blue"
            />
            <AdminStatCard
              label="Total Appointments"
              value={stats.totalAppointments}
              icon={<Calendar size={16} />}
              color="amber"
            />
          </div>

          {!hasChartData ? (
            <AdminEmptyState
              title="Not enough data yet"
              text="Monthly charts will appear once pets, applications, and appointments are added."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
                <h3 className="mb-4 font-semibold text-[#111827]">
                  Pets added per month
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart id="admin-pets-month-area" data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <Tooltip />
                    <Area
                      id="admin-pets-month-series"
                      type="monotone"
                      dataKey="pets"
                      stroke="#16A34A"
                      fill="#DCFCE7"
                      strokeWidth={2}
                      name="Pets"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
                <h3 className="mb-4 font-semibold text-[#111827]">
                  Applications per month
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    id="admin-applications-month-bar"
                    data={chartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <Tooltip />
                    <Bar
                      id="admin-applications-month-series"
                      dataKey="applications"
                      fill="#16A34A"
                      radius={[4, 4, 0, 0]}
                      name="Applications"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
                <h3 className="mb-4 font-semibold text-[#111827]">
                  Appointments per month
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    id="admin-appointments-month-bar"
                    data={chartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <Tooltip />
                    <Bar
                      id="admin-appointments-month-series"
                      dataKey="appointments"
                      fill="#86EFAC"
                      radius={[4, 4, 0, 0]}
                      name="Appointments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
