import { useMemo, useState } from 'react'
import {
  Calendar,
  Check,
  Clock,
  Eye,
  FileText,
  PawPrint,
  Stethoscope,
  X,
} from 'lucide-react'

import {
  useAppointmentDetails,
  useOwnerAppointments,
  useVeterinarianOptions,
  useVetAppointments,
} from '@/hooks/useAppointments'
import {
  createAppointment,
  type Appointment,
  type AppointmentStatus,
} from '@/services/appointments'

export function AppointmentBooking({
  onBooked,
  onCancel,
}: {
  onBooked: () => void
  onCancel: () => void
}) {
  const { veterinarians, loading, error: vetsError } = useVeterinarianOptions()
  const [form, setForm] = useState({
    vetId: '',
    date: '',
    time: '',
    petName: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const submit = async () => {
    setError('')
    if (!form.vetId || !form.date || !form.time || !form.petName.trim() || !form.reason.trim()) {
      setError('Complete all appointment fields.')
      return
    }
    const appointmentDate = new Date(`${form.date}T${form.time}`)
    if (appointmentDate <= new Date()) {
      setError('Choose a future appointment date and time.')
      return
    }

    setSubmitting(true)
    try {
      await createAppointment({
        vetId: form.vetId,
        petName: form.petName,
        reason: form.reason,
        appointmentDate: appointmentDate.toISOString(),
      })
      setSuccess(true)
      window.setTimeout(onBooked, 700)
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : 'Unable to book this appointment.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {success && <Toast message="Appointment booked successfully." />}
      <Header title="Book Appointment" subtitle="Schedule professional care for your pet" />
      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        {loading ? (
          <FormSkeleton />
        ) : vetsError ? (
          <Empty title="Unable to load veterinarians" text={vetsError} />
        ) : (
          <div className="space-y-4">
            <Field label="Veterinarian">
              <select value={form.vetId} onChange={(event) => update('vetId', event.target.value)} className={inputClass}>
                <option value="">Select a veterinarian</option>
                {veterinarians.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    {vet.full_name} — {vet.specialty} ({vet.clinic_name})
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(event) => update('date', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Time">
                <input type="time" value={form.time} onChange={(event) => update('time', event.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Pet name">
              <input value={form.petName} onChange={(event) => update('petName', event.target.value)} placeholder="e.g. Biscuit" className={inputClass} />
            </Field>
            <Field label="Reason for visit">
              <textarea value={form.reason} onChange={(event) => update('reason', event.target.value)} rows={4} placeholder="Describe symptoms or the purpose of this visit..." className={`${inputClass} resize-none`} />
            </Field>
            {error && <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 border-t border-[#F1F5F9] pt-5">
              <button onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
              <button disabled={submitting} onClick={() => void submit()} className={primaryButtonClass}>
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function OwnerAppointments({
  onBook,
}: {
  onBook: () => void
}) {
  const { appointments, loading, error, cancel } = useOwnerAppointments()
  const [tab, setTab] = useState('upcoming')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const filtered = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (tab === 'upcoming')
          return appointment.status === 'approved' && new Date(appointment.appointment_date) > new Date()
        return appointment.status === tab
      }),
    [appointments, tab],
  )

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setSaving(true)
    try {
      await cancel(cancelTarget.id)
      setNotice('Appointment cancelled successfully.')
      setCancelTarget(null)
      window.setTimeout(() => setNotice(''), 2500)
    } catch (cancelError) {
      setNotice(cancelError instanceof Error ? cancelError.message : 'Unable to cancel appointment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {notice && <Toast message={notice} />}
      <Header
        title="Appointments"
        subtitle="Manage your veterinary appointments"
        action={<button onClick={onBook} className={primaryButtonClass}>Book Appointment</button>}
      />
      <Tabs items={['upcoming', 'pending', 'completed', 'cancelled']} active={tab} onChange={setTab} />

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <Empty title="Unable to load appointments" text={error} />
      ) : filtered.length === 0 ? (
        <Empty title={`No ${tab} appointments`} text="Book an appointment when your pet needs veterinary care." action={<button onClick={onBook} className={primaryButtonClass}>Book Appointment</button>} />
      ) : (
        <AppointmentTable
          appointments={filtered}
          role="owner"
          onView={setSelectedId}
          onCancel={setCancelTarget}
        />
      )}

      <AppointmentDetails appointmentId={selectedId} onClose={() => setSelectedId(null)} />
      {cancelTarget && (
        <ConfirmModal
          title="Cancel appointment?"
          description={`Cancel ${cancelTarget.pet_name}'s appointment with ${cancelTarget.vet_name}?`}
          confirmLabel={saving ? 'Cancelling...' : 'Cancel Appointment'}
          danger
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => void confirmCancel()}
        />
      )}
    </div>
  )
}

export function VetAppointmentManagement({
  onOpenPrescription,
}: {
  onOpenPrescription: () => void
}) {
  const { appointments, loading, error, changeStatus, reschedule, complete } =
    useVetAppointments()
  const [tab, setTab] = useState('pending')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [action, setAction] = useState<{
    appointment: Appointment
    type: 'approve' | 'reject' | 'complete' | 'reschedule'
  } | null>(null)
  const [remarks, setRemarks] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const filtered = appointments.filter((appointment) => appointment.status === tab)

  const performAction = async () => {
    if (!action) return
    setSaving(true)
    try {
      if (action.type === 'reschedule') {
        if (!newDate) throw new Error('Choose a new date and time.')
        await reschedule(action.appointment.id, new Date(newDate).toISOString())
        setNotice('Appointment rescheduled and approved.')
      } else if (action.type === 'complete') {
        await complete(action.appointment.id, remarks)
        setNotice('Appointment marked as completed.')
      } else {
        const status: AppointmentStatus =
          action.type === 'approve' ? 'approved' : 'cancelled'
        await changeStatus(action.appointment.id, status, remarks)
        setNotice(
          action.type === 'approve'
            ? 'Appointment approved successfully.'
            : 'Appointment rejected successfully.',
        )
      }
      setAction(null)
      setRemarks('')
      setNewDate('')
      window.setTimeout(() => setNotice(''), 2500)
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : 'Unable to update appointment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {notice && <Toast message={notice} />}
      <Header title="Appointments" subtitle="Approve, reschedule, and complete appointments" />
      <Tabs items={['pending', 'approved', 'completed', 'cancelled']} active={tab} onChange={setTab} />
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <Empty title="Unable to load appointments" text={error} />
      ) : filtered.length === 0 ? (
        <Empty title={`No ${tab} appointments`} text="Appointments assigned to you will appear here." />
      ) : (
        <AppointmentTable
          appointments={filtered}
          role="vet"
          onView={setSelectedId}
          onApprove={(appointment) => setAction({ appointment, type: 'approve' })}
          onReject={(appointment) => setAction({ appointment, type: 'reject' })}
          onReschedule={(appointment) => setAction({ appointment, type: 'reschedule' })}
          onComplete={(appointment) => setAction({ appointment, type: 'complete' })}
          onPrescription={onOpenPrescription}
        />
      )}
      <AppointmentDetails appointmentId={selectedId} onClose={() => setSelectedId(null)} />

      {action && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold capitalize text-[#111827]">{action.type} appointment</h2>
            {action.type === 'reschedule' ? (
              <Field label="New date and time">
                <input type="datetime-local" min={toLocalDateTime(new Date())} value={newDate} onChange={(event) => setNewDate(event.target.value)} className={inputClass} />
              </Field>
            ) : (
              <Field label="Optional remarks">
                <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={4} className={inputClass} />
              </Field>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button disabled={saving} onClick={() => setAction(null)} className={secondaryButtonClass}>Cancel</button>
              <button disabled={saving} onClick={() => void performAction()} className={action.type === 'reject' ? dangerButtonClass : primaryButtonClass}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentTable({
  appointments,
  role,
  onView,
  onCancel,
  onApprove,
  onReject,
  onReschedule,
  onComplete,
  onPrescription,
}: {
  appointments: Appointment[]
  role: 'owner' | 'vet'
  onView: (id: string) => void
  onCancel?: (appointment: Appointment) => void
  onApprove?: (appointment: Appointment) => void
  onReject?: (appointment: Appointment) => void
  onReschedule?: (appointment: Appointment) => void
  onComplete?: (appointment: Appointment) => void
  onPrescription?: () => void
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
            <tr>
              {(role === 'owner'
                ? ['Veterinarian', 'Date & Time', 'Pet', 'Status', 'Actions']
                : ['Owner', 'Date & Time', 'Pet', 'Status', 'Actions']
              ).map((heading) => (
                <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#6B7280]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-[#F8FAFC]">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-[#111827]">{role === 'owner' ? appointment.vet_name : appointment.owner_name}</p>
                  <p className="text-xs text-[#9CA3AF]">{role === 'owner' ? appointment.specialty : appointment.owner_email}</p>
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">{formatDateTime(appointment.appointment_date)}</td>
                <td className="px-5 py-4 text-sm text-[#374151]">{appointment.pet_name}</td>
                <td className="px-5 py-4"><StatusBadge status={appointment.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onView(appointment.id)} className={smallButtonClass}><Eye size={13} /> View</button>
                    {role === 'owner' && ['pending', 'approved'].includes(appointment.status) && (
                      <button onClick={() => onCancel?.(appointment)} className={`${smallButtonClass} text-red-500`}>Cancel</button>
                    )}
                    {role === 'vet' && appointment.status === 'pending' && (
                      <>
                        <button onClick={() => onApprove?.(appointment)} className={`${smallButtonClass} text-[#15803D]`}><Check size={13} /> Approve</button>
                        <button onClick={() => onReject?.(appointment)} className={`${smallButtonClass} text-red-500`}><X size={13} /> Reject</button>
                        <button onClick={() => onReschedule?.(appointment)} className={smallButtonClass}><Clock size={13} /> Reschedule</button>
                      </>
                    )}
                    {role === 'vet' && appointment.status === 'approved' && (
                      <>
                        <button onClick={() => onReschedule?.(appointment)} className={smallButtonClass}><Clock size={13} /> Reschedule</button>
                        <button onClick={() => onComplete?.(appointment)} className={`${smallButtonClass} text-[#15803D]`}><Check size={13} /> Complete</button>
                      </>
                    )}
                    {role === 'vet' && appointment.status === 'completed' && (
                      <button onClick={onPrescription} className={`${smallButtonClass} text-[#16A34A]`}><FileText size={13} /> Prescription</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AppointmentDetails({ appointmentId, onClose }: { appointmentId: string | null; onClose: () => void }) {
  const { appointment, loading, error } = useAppointmentDetails(appointmentId)
  if (!appointmentId) return null
  return (
    <div className="fixed inset-0 z-[75] flex justify-end bg-[#111827]/35 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#111827]">Appointment Details</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]"><X size={18} /></button>
        </div>
        {loading ? <FormSkeleton /> : error || !appointment ? (
          <Empty title="Unable to load details" text={error ?? 'Appointment not found.'} />
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-[14px] bg-[#F0FDF4] p-4">
              <Stethoscope className="text-[#16A34A]" size={22} />
              <div><p className="font-semibold text-[#111827]">{appointment.vet_name}</p><p className="text-xs text-[#6B7280]">{appointment.clinic_name} · {appointment.specialty}</p></div>
            </div>
            <Details title="Owner" value={`${appointment.owner_name} · ${appointment.owner_email} · ${appointment.owner_phone}`} />
            <Details title="Pet" value={appointment.pet_name} />
            <Details title="Scheduled time" value={formatDateTime(appointment.appointment_date)} />
            <Details title="Reason for visit" value={appointment.reason} />
            <Details title="Status" value={appointment.status} />
            <Details title="Remarks" value={appointment.remarks || 'No remarks'} />
          </div>
        )}
      </div>
    </div>
  )
}

function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="mb-6 flex gap-1.5">{items.map((item) => <button key={item} onClick={() => onChange(item)} className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${active === item ? 'bg-[#16A34A] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'}`}>{item}</button>)}</div>
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const colors = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-50 text-red-600',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colors[status]}`}>{status}</span>
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-start justify-between"><div><h1 className="text-xl font-bold text-[#111827]">{title}</h1><p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p></div>{action}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#374151]">{label}{children}</label>
}

function Details({ title, value }: { title: string; value: string }) {
  return <div className="rounded-[12px] border border-[#E5E7EB] p-4"><p className="text-xs font-semibold uppercase text-[#9CA3AF]">{title}</p><p className="mt-1 text-sm text-[#374151]">{value}</p></div>
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center"><PawPrint className="mx-auto text-[#16A34A]" size={28} /><h3 className="mt-3 font-semibold text-[#111827]">{title}</h3><p className="mt-1 text-sm text-[#6B7280]">{text}</p>{action && <div className="mt-5">{action}</div>}</div>
}

function ConfirmModal({ title, description, confirmLabel, danger, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-[#111827]">{title}</h2><p className="mt-2 text-sm text-[#6B7280]">{description}</p><div className="mt-5 flex justify-end gap-3"><button onClick={onCancel} className={secondaryButtonClass}>Keep Appointment</button><button onClick={onConfirm} className={danger ? dangerButtonClass : primaryButtonClass}>{confirmLabel}</button></div></div></div>
}

function FormSkeleton() {
  return <div className="mt-4 space-y-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-[10px] bg-[#E5E7EB]" />)}</div>
}

function TableSkeleton() {
  return <div className="space-y-3 rounded-[14px] border border-[#E5E7EB] bg-white p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-[#E5E7EB]" />)}</div>
}

function Toast({ message }: { message: string }) {
  return <div role="status" className="fixed right-5 top-5 z-[90] rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg">{message}</div>
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function toLocalDateTime(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

const inputClass = 'mt-1.5 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]'
const primaryButtonClass = 'rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D] disabled:opacity-60'
const secondaryButtonClass = 'rounded-[10px] border border-[#E5E7EB] px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]'
const dangerButtonClass = 'rounded-[10px] bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60'
const smallButtonClass = 'inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F8FAFC]'
