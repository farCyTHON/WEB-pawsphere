import { useEffect, useState } from 'react'

import { useAdminSettings } from '@/hooks/useAdmin'
import type { AppSettings } from '@/services/admin'

import {
  AdminNotice,
  AdminPageTitle,
  AdminSkeleton,
} from './ui'

export function AdminSettingsScreen() {
  const { data, loading, error, save } = useAdminSettings()
  const [form, setForm] = useState<AppSettings>(data)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    setForm(data)
  }, [data])

  const onSave = async () => {
    setSaving(true)
    try {
      await save(form)
      setNotice({
        type: 'success',
        message: 'Platform settings saved.',
      })
    } catch (saveError) {
      setNotice({
        type: 'error',
        message:
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save settings.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminNotice notice={notice} onClose={() => setNotice(null)} />
      <AdminPageTitle
        title="Settings"
        subtitle="Basic platform configuration"
      />

      <div className="max-w-xl rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        {loading ? (
          <div className="space-y-4">
            <AdminSkeleton className="h-10 w-full" />
            <AdminSkeleton className="h-10 w-full" />
            <AdminSkeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#111827]">
                Platform name
              </label>
              <input
                value={form.platform_name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    platform_name: event.target.value,
                  }))
                }
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#111827]">
                Contact email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    contact_email: event.target.value,
                  }))
                }
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#16A34A]"
              />
            </div>

            <div className="flex items-center justify-between rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  Maintenance mode
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  UI toggle only — does not block public access yet.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.maintenance_mode}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    maintenance_mode: !prev.maintenance_mode,
                  }))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form.maintenance_mode ? 'bg-[#16A34A]' : 'bg-[#D1D5DB]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.maintenance_mode ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              disabled={saving}
              onClick={() => void onSave()}
              className="rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
