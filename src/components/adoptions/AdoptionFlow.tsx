import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Home,
  PawPrint,
  ShieldCheck,
  X,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import {
  useApplicationDetails,
  useOwnerApplications,
  useShelterApplications,
} from '@/hooks/useAdoptionApplications'
import {
  DuplicateApplicationError,
  submitApplication,
  type AdoptionApplication,
  type AdoptionStatus,
} from '@/services/adoptions'
import type { PublicPet } from '@/services/pets'

const TIMELINE = [
  'Submitted',
  'Review',
  'Interview',
  'Approved',
  'Meet & Greet',
  'Completed',
]

const STATUS_STEP: Record<AdoptionStatus, number> = {
  pending: 1,
  review: 2,
  interview: 3,
  approved: 4,
  meet_and_greet: 5,
  completed: 6,
  rejected: 1,
}

export function AdoptionApplicationWizard({
  pet,
  onCancel,
  onSubmitted,
}: {
  pet: PublicPet
  onCancel: () => void
  onSubmitted: () => void
}) {
  const { profile } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    housingType: '',
    hasYard: false,
    otherPets: '',
    adoptionExperience: '',
    notes: '',
  })

  const update = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }))

  const continueWizard = () => {
    setError('')
    if (step === 2 && !form.housingType) {
      setError('Select your housing type.')
      return
    }
    if (step === 3 && !form.adoptionExperience.trim()) {
      setError('Tell the shelter about your pet-care experience.')
      return
    }
    setStep((current) => Math.min(4, current + 1))
  }

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await submitApplication(pet.id, form)
      setSubmitted(true)
      window.setTimeout(onSubmitted, 700)
    } catch (submitError) {
      setError(
        submitError instanceof DuplicateApplicationError
          ? submitError.message
          : submitError instanceof Error
            ? submitError.message
            : 'Unable to submit your application.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {submitted && <Toast message="Application submitted successfully." />}
      <div className="mb-6">
        <button onClick={onCancel} className="flex items-center gap-1 text-sm font-medium text-[#6B7280]">
          <ChevronLeft size={15} /> Back to pet
        </button>
        <h1 className="mt-5 text-2xl font-bold text-[#111827]">
          Apply to adopt {pet.name}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Complete the application for {pet.shelter_name}.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {['Your Details', 'Living Conditions', 'Experience', 'Review'].map(
          (label, index) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full ${index < step ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`} />
              <p className="mt-1 text-center text-[10px] text-[#9CA3AF]">{label}</p>
            </div>
          ),
        )}
      </div>

      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-[#111827]">Your information</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              This information comes from your PawSphere profile.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Summary label="Full name" value={profile?.full_name ?? ''} />
              <Summary label="Email" value={profile?.email ?? ''} />
              <Summary label="Phone" value={profile?.phone ?? ''} />
              <Summary label="Pet" value={`${pet.name} · ${pet.breed}`} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#111827]">Living conditions</h2>
            <label className="block text-sm font-medium text-[#374151]">
              Housing type
              <select value={form.housingType} onChange={(event) => update('housingType', event.target.value)} className={inputClass}>
                <option value="">Select housing type</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Farm / Rural property</option>
                <option>Other</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#374151]">
              <input type="checkbox" checked={form.hasYard} onChange={(event) => update('hasYard', event.target.checked)} className="accent-[#16A34A]" />
              I have access to a secure yard or outdoor area
            </label>
            <label className="block text-sm font-medium text-[#374151]">
              Other pets in your household
              <textarea value={form.otherPets} onChange={(event) => update('otherPets', event.target.value)} rows={3} className={inputClass} placeholder="Tell us about any other pets..." />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#111827]">Pet-care experience</h2>
            <label className="block text-sm font-medium text-[#374151]">
              Previous experience
              <textarea value={form.adoptionExperience} onChange={(event) => update('adoptionExperience', event.target.value)} rows={4} className={inputClass} placeholder="Describe your experience caring for pets..." />
            </label>
            <label className="block text-sm font-medium text-[#374151]">
              Additional notes
              <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows={4} className={inputClass} placeholder="Why would this pet be a good fit for your home?" />
            </label>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
              <ShieldCheck size={23} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#111827]">
              Review your application
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Confirm these details before submitting to the shelter.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Summary label="Pet" value={pet.name} />
              <Summary label="Shelter" value={pet.shelter_name} />
              <Summary label="Housing" value={form.housingType} />
              <Summary label="Secure yard" value={form.hasYard ? 'Yes' : 'No'} />
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-between border-t border-[#F1F5F9] pt-5">
          <button
            onClick={() => (step === 1 ? onCancel() : setStep((current) => current - 1))}
            className="text-sm font-medium text-[#6B7280]"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 4 ? (
            <button onClick={continueWizard} className={primaryButtonClass}>
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button disabled={submitting} onClick={() => void submit()} className={primaryButtonClass}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function OwnerAdoptionApplications() {
  const { applications, loading, error } = useOwnerApplications()
  const [tab, setTab] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = applications.filter((application) => {
    if (tab === 'all') return true
    if (tab === 'pending')
      return ['pending', 'review', 'interview'].includes(application.status)
    if (tab === 'approved')
      return ['approved', 'meet_and_greet'].includes(application.status)
    return application.status === tab
  })

  return (
    <div>
      <Header title="My Applications" subtitle="Track your pet adoption journey" />
      <div className="mb-6 flex gap-1.5">
        {['all', 'pending', 'approved', 'rejected', 'completed'].map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${tab === item ? 'bg-[#16A34A] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'}`}>
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <ApplicationSkeletons />
      ) : error ? (
        <Empty title="Unable to load applications" text={error} />
      ) : filtered.length === 0 ? (
        <Empty title="No applications found" text="Applications you submit will appear here." />
      ) : (
        <div className="space-y-4">
          {filtered.map((application) => (
            <div key={application.id} className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-start gap-4">
                {application.pet_image ? (
                  <img src={application.pet_image} alt={application.pet_name} className="h-14 w-14 rounded-[10px] object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-[10px] bg-[#E5E7EB]" />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[#111827]">{application.pet_name}</h3>
                      <p className="mt-0.5 text-xs text-[#6B7280]">{application.shelter_name} · Applied {formatDate(application.created_at)}</p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                  {application.status === 'rejected' ? (
                    <p className="mt-4 rounded-[10px] bg-red-50 p-3 text-xs text-red-600">
                      {application.remarks || 'The shelter did not approve this application.'}
                    </p>
                  ) : (
                    <ApplicationTimeline status={application.status} />
                  )}
                  <button onClick={() => setSelectedId(application.id)} className="mt-4 text-xs font-semibold text-[#16A34A] hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ApplicationDetailsModal applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

export function ShelterAdoptionApplications() {
  const { applications, loading, error, changeStatus, complete } =
    useShelterApplications()
  const [tab, setTab] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [action, setAction] = useState<{
    application: AdoptionApplication
    status: AdoptionStatus
  } | null>(null)
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const filtered = useMemo(
    () =>
      tab === 'all'
        ? applications
        : applications.filter((application) => application.status === tab),
    [applications, tab],
  )

  const applyStatus = async () => {
    if (!action) return
    setSaving(true)
    try {
      if (action.status === 'completed') {
        await complete(action.application.id, remarks)
      } else {
        await changeStatus(action.application.id, action.status, remarks)
      }
      setNotice(
        action.status === 'rejected'
          ? 'Application rejected successfully.'
          : action.status === 'completed'
            ? 'Adoption completed and pet marked adopted.'
            : 'Application approved and pet marked reserved.',
      )
      setAction(null)
      setRemarks('')
      window.setTimeout(() => setNotice(''), 3000)
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'Unable to update application.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {notice && <Toast message={notice} />}
      <Header title="Adoption Applications" subtitle="Review and manage applications" />
      <div className="mb-6 flex gap-1.5">
        {['all', 'pending', 'review', 'interview', 'approved', 'rejected', 'completed'].map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${tab === item ? 'bg-[#16A34A] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'}`}>
            {item.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <ApplicationTableSkeleton />
      ) : error ? (
        <Empty title="Unable to load applications" text={error} />
      ) : filtered.length === 0 ? (
        <Empty title="No applications found" text="New adoption applications will appear here." />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  {['Applicant', 'Pet', 'Date', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#6B7280]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((application) => (
                  <tr key={application.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#111827]">{application.applicant_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{application.applicant_email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{application.pet_name}</td>
                    <td className="px-5 py-4 text-sm text-[#6B7280]">{formatDate(application.created_at)}</td>
                    <td className="px-5 py-4"><StatusBadge status={application.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelectedId(application.id)} className={smallButtonClass}><Eye size={13} /> View</button>
                        {!['approved', 'completed', 'rejected'].includes(application.status) && (
                          <>
                            <button onClick={() => setAction({ application, status: 'approved' })} className={`${smallButtonClass} text-[#15803D]`}><Check size={13} /> Approve</button>
                            <button onClick={() => setAction({ application, status: 'rejected' })} className={`${smallButtonClass} text-red-500`}><X size={13} /> Reject</button>
                          </>
                        )}
                        {['approved', 'meet_and_greet'].includes(application.status) && (
                          <button onClick={() => setAction({ application, status: 'completed' })} className={`${smallButtonClass} text-[#15803D]`}><CheckCircle size={13} /> Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ApplicationDetailsModal applicationId={selectedId} onClose={() => setSelectedId(null)} />

      {action && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold capitalize text-[#111827]">
              {action.status.replaceAll('_', ' ')} application
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Add optional remarks for {action.application.applicant_name}.
            </p>
            <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={4} className={`${inputClass} mt-4`} placeholder="Optional remarks..." />
            <div className="mt-5 flex justify-end gap-3">
              <button disabled={saving} onClick={() => setAction(null)} className="rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm">Cancel</button>
              <button disabled={saving} onClick={() => void applyStatus()} className={action.status === 'rejected' ? dangerButtonClass : primaryButtonClass}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApplicationDetailsModal({
  applicationId,
  onClose,
}: {
  applicationId: string | null
  onClose: () => void
}) {
  const { application, loading, error } = useApplicationDetails(applicationId)
  if (!applicationId) return null

  return (
    <div className="fixed inset-0 z-[75] flex justify-end bg-[#111827]/35 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#111827]">Application Details</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]"><X size={18} /></button>
        </div>
        {loading ? (
          <ApplicationSkeletons />
        ) : error || !application ? (
          <Empty title="Unable to load details" text={error ?? 'Application not found.'} />
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3">
              {application.pet_image && <img src={application.pet_image} alt={application.pet_name} className="h-16 w-16 rounded-[12px] object-cover" />}
              <div>
                <h3 className="font-semibold text-[#111827]">{application.pet_name}</h3>
                <p className="text-sm text-[#6B7280]">{application.shelter_name}</p>
                <StatusBadge status={application.status} />
              </div>
            </div>
            <DetailsSection title="Applicant">
              <Summary label="Name" value={application.applicant_name} />
              <Summary label="Email" value={application.applicant_email} />
              <Summary label="Phone" value={application.applicant_phone} />
            </DetailsSection>
            <DetailsSection title="Living Conditions">
              <Summary label="Housing" value={application.housing_type} />
              <Summary label="Secure yard" value={application.has_yard ? 'Yes' : 'No'} />
              <Summary label="Other pets" value={application.other_pets || 'None provided'} />
            </DetailsSection>
            <DetailsSection title="Experience and Notes">
              <Summary label="Experience" value={application.adoption_experience} />
              <Summary label="Submitted notes" value={application.notes || 'None provided'} />
              <Summary label="Shelter remarks" value={application.remarks || 'No remarks yet'} />
            </DetailsSection>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationTimeline({ status }: { status: AdoptionStatus }) {
  const step = STATUS_STEP[status]
  return (
    <div className="mt-5 flex items-start">
      {TIMELINE.map((label, index) => {
        const done = index < step
        const current = index === step - 1
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-[#16A34A] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'} ${current ? 'ring-4 ring-green-100' : ''}`}>
                {done && index < step - 1 ? <Check size={12} /> : index + 1}
              </div>
              <span className={`mt-1.5 w-16 text-center text-[9px] ${current ? 'font-semibold text-[#16A34A]' : 'text-[#9CA3AF]'}`}>{label}</span>
            </div>
            {index < TIMELINE.length - 1 && <div className={`mt-3 h-0.5 flex-1 ${index < step - 1 ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`} />}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: AdoptionStatus }) {
  const colors: Record<AdoptionStatus, string> = {
    pending: 'bg-amber-50 text-amber-700',
    review: 'bg-blue-50 text-blue-700',
    interview: 'bg-purple-50 text-purple-700',
    approved: 'bg-green-50 text-green-700',
    meet_and_greet: 'bg-cyan-50 text-cyan-700',
    rejected: 'bg-red-50 text-red-600',
    completed: 'bg-slate-100 text-slate-700',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colors[status]}`}>{status.replaceAll('_', ' ')}</span>
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-6"><h1 className="text-xl font-bold text-[#111827]">{title}</h1><p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p></div>
}

function DetailsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="mb-2 text-sm font-semibold text-[#111827]">{title}</h3><div className="grid grid-cols-1 gap-2 rounded-[12px] bg-[#F8FAFC] p-3">{children}</div></section>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-3"><p className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">{label}</p><p className="mt-1 text-sm font-medium text-[#374151]">{value || '—'}</p></div>
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center"><PawPrint className="mx-auto text-[#16A34A]" size={28} /><h3 className="mt-3 font-semibold text-[#111827]">{title}</h3><p className="mt-1 text-sm text-[#6B7280]">{text}</p></div>
}

function ApplicationSkeletons() {
  return <div className="mt-5 space-y-4">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[14px] bg-[#E5E7EB]" />)}</div>
}

function ApplicationTableSkeleton() {
  return <div className="space-y-3 rounded-[14px] border border-[#E5E7EB] bg-white p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-[#E5E7EB]" />)}</div>
}

function Toast({ message }: { message: string }) {
  return <div role="status" className="fixed right-5 top-5 z-[90] rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg">{message}</div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

const inputClass = 'mt-1.5 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]'
const primaryButtonClass = 'inline-flex items-center justify-center gap-1 rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D] disabled:opacity-60'
const dangerButtonClass = 'rounded-[10px] bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60'
const smallButtonClass = 'inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F8FAFC]'
