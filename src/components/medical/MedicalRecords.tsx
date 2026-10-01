import { useMemo, useState } from 'react'
import {
  Activity,
  CalendarCheck,
  Edit,
  FileText,
  Pill,
  Syringe,
  Trash2,
  X,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useVetAppointments } from '@/hooks/useAppointments'
import {
  useMedicalTimeline,
  useOwnerMedicalRecords,
  useVaccinations,
  useVetMedicalRecords,
  useVetPatients,
} from '@/hooks/useMedicalRecords'
import { PdfActions } from '@/components/documents/PdfActions'
import { createMedicalRecord, type MedicalRecord, type TimelineEventType, type VaccinationInput } from '@/services/medical'
import { generatePrescriptionPDF, generateVaccinationPDF, type PdfAction } from '@/services/pdf'

export function PrescriptionEditor() {
  const { appointments, loading: appointmentsLoading, refresh: refreshAppointments } =
    useVetAppointments()
  const { records, loading: recordsLoading, refresh: refreshRecords } =
    useVetMedicalRecords()
  const [form, setForm] = useState({
    appointmentId: '',
    diagnosis: '',
    prescription: '',
    followUpDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [issuedRecordId, setIssuedRecordId] = useState<string | null>(null)

  const eligible = appointments.filter((appointment) =>
    ['approved', 'completed'].includes(appointment.status),
  )
  const selected = eligible.find(
    (appointment) => appointment.id === form.appointmentId,
  )
  const issuedRecord = records.find((record) => record.id === issuedRecordId)

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const issue = async () => {
    setError('')
    try {
      setSaving(true)
      const recordId = await createMedicalRecord({
        appointmentId: form.appointmentId,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
        followUpDate: form.followUpDate || null,
      })
      setIssuedRecordId(recordId)
      setForm({
        appointmentId: '',
        diagnosis: '',
        prescription: '',
        followUpDate: '',
      })
      await Promise.all([refreshRecords(), refreshAppointments()])
      setNotice('Prescription issued and appointment completed.')
      window.setTimeout(() => setNotice(''), 2500)
    } catch (issueError) {
      setError(
        issueError instanceof Error
          ? issueError.message
          : 'Unable to issue this prescription.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {notice && <Toast message={notice} />}
      <PageHeader
        title="Prescription Editor"
        subtitle="Create and issue digital prescriptions"
      />

      <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        {appointmentsLoading ? (
          <FormSkeleton />
        ) : eligible.length === 0 ? (
          <EmptyState
            icon={<Pill size={26} />}
            title="No patients ready for a prescription"
            text="Approve or complete an appointment to issue a prescription."
          />
        ) : (
          <div className="space-y-4">
            <Field label="Patient">
              <select
                value={form.appointmentId}
                onChange={(event) => update('appointmentId', event.target.value)}
                className={inputClass}
              >
                <option value="">Select an appointment</option>
                {eligible.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.pet_name} — {appointment.owner_name} (
                    {formatDate(appointment.appointment_date)})
                  </option>
                ))}
              </select>
            </Field>

            {selected && (
              <div className="rounded-[12px] bg-[#F0FDF4] p-4 text-sm text-[#374151]">
                <p className="font-semibold text-[#111827]">
                  {selected.pet_name} · {selected.owner_name}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {formatDateTime(selected.appointment_date)} · {selected.reason}
                </p>
              </div>
            )}

            <Field label="Diagnosis">
              <textarea
                rows={3}
                value={form.diagnosis}
                onChange={(event) => update('diagnosis', event.target.value)}
                placeholder="Enter diagnosis..."
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field label="Prescription">
              <textarea
                rows={5}
                value={form.prescription}
                onChange={(event) => update('prescription', event.target.value)}
                placeholder="Medicines, dosage, duration, and instructions..."
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field label="Follow-up date">
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.followUpDate}
                onChange={(event) => update('followUpDate', event.target.value)}
                className={inputClass}
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                disabled={saving}
                onClick={() => void issue()}
                className="w-full rounded-[10px] bg-[#16A34A] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15803D] disabled:opacity-60"
              >
                {saving ? 'Issuing...' : 'Issue Prescription'}
              </button>
              <PdfActions
                disabled={!issuedRecord}
                onAction={(action) => {
                  if (issuedRecord) generatePrescriptionPDF(issuedRecord, action)
                }}
              />
            </div>
          </div>
        )}
      </div>

      <section className="mt-6">
        <h3 className="mb-3 font-semibold text-[#111827]">Issued prescriptions</h3>
        {recordsLoading ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<FileText size={26} />}
            title="No prescriptions issued yet"
            text="Issued prescriptions appear here with a PDF download."
          />
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <PrescriptionCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export function VetPatientRecords() {
  const { patients, loading, error } = useVetPatients()
  const { records } = useVetMedicalRecords()
  const { vaccinations } = useVaccinations()
  const { appointments } = useVetAppointments()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const patientKey = (ownerId: string, petName: string) =>
    `${ownerId}:${petName.toLowerCase()}`
  const selected = patients.find(
    (patient) => patientKey(patient.owner_id, patient.pet_name) === selectedKey,
  )

  const selectedRecords = selected
    ? records.filter(
        (record) =>
          record.owner_id === selected.owner_id &&
          record.pet_name.toLowerCase() === selected.pet_name.toLowerCase(),
      )
    : []
  const selectedVaccinations = selected
    ? vaccinations.filter(
        (vaccination) =>
          vaccination.owner_id === selected.owner_id &&
          vaccination.pet_name.toLowerCase() === selected.pet_name.toLowerCase(),
      )
    : []
  const selectedAppointments = selected
    ? appointments.filter(
        (appointment) =>
          appointment.owner_id === selected.owner_id &&
          appointment.pet_name.toLowerCase() === selected.pet_name.toLowerCase(),
      )
    : []

  return (
    <div>
      <PageHeader title="Patient Records" subtitle="Medical history for all patients" />
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <EmptyState icon={<Activity size={26} />} title="Unable to load patients" text={error} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<Activity size={26} />}
          title="No patients yet"
          text="Patients appear here once owners book appointments with you."
        />
      ) : (
        <div className="flex gap-5">
          <div className="flex-1 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
            <table className="w-full">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  {['Pet', 'Owner', 'Last Visit', 'Next Visit', 'Vaccinations', ''].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#6B7280]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {patients.map((patient) => {
                  const key = patientKey(patient.owner_id, patient.pet_name)
                  return (
                    <tr
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className={`cursor-pointer hover:bg-[#F8FAFC] ${selectedKey === key ? 'bg-[#F0FDF4]' : ''}`}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-[#111827]">{patient.pet_name}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{patient.owner_name}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{formatDate(patient.last_visit)}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{formatDate(patient.next_visit)}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{patient.vaccination_count}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-[#16A34A]">View</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="w-80 flex-shrink-0 space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-5">
              <div>
                <h3 className="font-semibold text-[#111827]">{selected.pet_name}</h3>
                <p className="text-xs text-[#6B7280]">
                  {selected.total_appointments} appointment
                  {selected.total_appointments === 1 ? '' : 's'}
                </p>
              </div>
              <DetailRow label="Owner" value={selected.owner_name} />
              <DetailRow label="Email" value={selected.owner_email} />
              <DetailRow label="Phone" value={selected.owner_phone} />
              <DetailRow label="Next follow-up" value={formatDate(selected.next_follow_up)} />

              <Section title="Appointment history">
                {selectedAppointments.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No appointments recorded.</p>
                ) : (
                  selectedAppointments.map((appointment) => (
                    <p key={appointment.id} className="text-xs text-[#6B7280]">
                      {formatDateTime(appointment.appointment_date)} · {appointment.status}
                    </p>
                  ))
                )}
              </Section>

              <Section title="Diagnosis and prescriptions">
                {selectedRecords.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No medical records yet.</p>
                ) : (
                  selectedRecords.map((record) => (
                    <div key={record.id} className="rounded-[10px] border border-[#E5E7EB] p-3">
                      <p className="text-xs font-semibold text-[#111827]">{record.diagnosis}</p>
                      <p className="mt-1 text-xs text-[#6B7280]">{record.prescription}</p>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">
                        {formatDate(record.created_at)} · Follow-up {formatDate(record.follow_up_date)}
                      </p>
                      <div className="mt-2">
                        <PdfActions
                          compact
                          onAction={(action) => generatePrescriptionPDF(record, action)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </Section>

              <Section title="Vaccination summary">
                {selectedVaccinations.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No vaccinations recorded.</p>
                ) : (
                  selectedVaccinations.map((vaccination) => (
                    <p key={vaccination.id} className="text-xs text-[#6B7280]">
                      {vaccination.vaccine_name} · {formatDate(vaccination.vaccination_date)} · next{' '}
                      {formatDate(vaccination.next_due_date)}
                    </p>
                  ))
                )}
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MedicalTimelineScreen() {
  const [petFilter, setPetFilter] = useState('')
  const { events: allEvents, loading, error } = useMedicalTimeline()

  const pets = useMemo(
    () => Array.from(new Set(allEvents.map((event) => event.pet_name))).sort(),
    [allEvents],
  )
  const events = useMemo(
    () =>
      petFilter
        ? allEvents.filter((event) => event.pet_name === petFilter)
        : allEvents,
    [allEvents, petFilter],
  )

  return (
    <div>
      <PageHeader title="Medical History" subtitle="Chronological patient medical records" />
      {pets.length > 0 && (
        <div className="mb-5 max-w-xs">
          <select
            value={petFilter}
            onChange={(event) => setPetFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">All pets</option>
            {pets.map((pet) => (
              <option key={pet} value={pet}>
                {pet}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
        {loading ? (
          <TimelineSkeleton />
        ) : error ? (
          <EmptyState icon={<Activity size={26} />} title="Unable to load timeline" text={error} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Activity size={26} />}
            title="No medical events yet"
            text="Appointments, diagnoses, prescriptions, and vaccinations appear here."
          />
        ) : (
          <div>
            {events.map((event, index) => (
              <div key={`${event.event_type}-${event.event_date}-${index}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#16A34A]" />
                  {index < events.length - 1 && <div className="my-1 w-0.5 flex-1 bg-[#E5E7EB]" />}
                </div>
                <div className="flex-1 pb-5">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">
                        {event.pet_name} — {event.title}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {formatDateTime(event.event_date)}
                        {event.actor ? ` · ${event.actor}` : ''}
                      </p>
                    </div>
                    <EventBadge type={event.event_type} />
                  </div>
                  <p className="text-sm text-[#6B7280]">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function VaccinationRecords({ canManage = false }: { canManage?: boolean }) {
  const { profile } = useAuth()
  const { vaccinations, loading, error, add, update, remove } = useVaccinations()
  const { patients } = useVetPatients()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<VaccinationInput>(emptyVaccinationForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyVaccinationForm(),
      veterinarianName: profile?.full_name ?? '',
    })
    setFormError('')
    setEditorOpen(true)
  }

  const openEdit = (vaccinationId: string) => {
    const vaccination = vaccinations.find((item) => item.id === vaccinationId)
    if (!vaccination) return
    setEditingId(vaccinationId)
    setForm({
      petName: vaccination.pet_name,
      ownerId: vaccination.owner_id,
      vaccineName: vaccination.vaccine_name,
      vaccinationDate: vaccination.vaccination_date,
      nextDueDate: vaccination.next_due_date,
      veterinarianName: vaccination.veterinarian_name,
      notes: vaccination.notes,
    })
    setFormError('')
    setEditorOpen(true)
  }

  const save = async () => {
    setFormError('')
    setSaving(true)
    try {
      if (editingId) {
        await update(editingId, form)
        showNotice('Vaccination updated successfully.')
      } else {
        await add(form)
        showNotice('Vaccination added successfully.')
      }
      setEditorOpen(false)
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Unable to save vaccination.',
      )
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await remove(deleteId)
      showNotice('Vaccination deleted successfully.')
    } catch (deleteError) {
      showNotice(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete vaccination.',
      )
    } finally {
      setDeleteId(null)
    }
  }

  const exportPdf = (action: PdfAction) => {
    try {
      generateVaccinationPDF(vaccinations, undefined, action)
    } catch (pdfError) {
      showNotice(pdfError instanceof Error ? pdfError.message : 'Unable to export PDF.')
    }
  }

  return (
    <div>
      {notice && <Toast message={notice} />}
      <PageHeader
        title="Vaccination Records"
        subtitle={
          canManage
            ? 'Track vaccines and renewal dates for your patients'
            : "Your pets' vaccination history"
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PdfActions
              compact
              disabled={vaccinations.length === 0}
              onAction={exportPdf}
            />
            {canManage && (
              <button
                onClick={openCreate}
                className="rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]"
              >
                Add Vaccination
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <EmptyState icon={<Syringe size={26} />} title="Unable to load vaccinations" text={error} />
      ) : vaccinations.length === 0 ? (
        <EmptyState
          icon={<Syringe size={26} />}
          title="No vaccination records yet"
          text={
            canManage
              ? 'Add a vaccination to start building the record.'
              : 'Vaccinations added by your veterinarian appear here.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          <table className="w-full">
            <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <tr>
                {['Vaccine', 'Pet', 'Date', 'Next Due', 'Veterinarian', 'Notes', canManage ? 'Actions' : ''].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#6B7280]">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {vaccinations.map((vaccination) => (
                <tr key={vaccination.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-5 py-4 text-sm font-medium text-[#111827]">{vaccination.vaccine_name}</td>
                  <td className="px-5 py-4 text-sm text-[#374151]">{vaccination.pet_name}</td>
                  <td className="px-5 py-4 text-sm text-[#374151]">{formatDate(vaccination.vaccination_date)}</td>
                  <td className="px-5 py-4 text-sm text-[#374151]">{formatDate(vaccination.next_due_date)}</td>
                  <td className="px-5 py-4 text-sm text-[#374151]">{vaccination.veterinarian_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-[#6B7280]">{vaccination.notes || '—'}</td>
                  <td className="px-5 py-4">
                    {canManage && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(vaccination.id)} className={smallButtonClass}>
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(vaccination.id)}
                          className={`${smallButtonClass} text-red-500`}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen && (
        <Modal title={editingId ? 'Edit vaccination' : 'Add vaccination'} onClose={() => setEditorOpen(false)}>
          <div className="space-y-3">
            <Field label="Patient">
              <select
                value={form.ownerId ? `${form.ownerId}|${form.petName}` : ''}
                onChange={(event) => {
                  const [ownerId, petName] = event.target.value.split('|')
                  setForm((current) => ({ ...current, ownerId: ownerId ?? '', petName: petName ?? '' }))
                }}
                className={inputClass}
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option
                    key={`${patient.owner_id}-${patient.pet_name}`}
                    value={`${patient.owner_id}|${patient.pet_name}`}
                  >
                    {patient.pet_name} — {patient.owner_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vaccine name">
              <input
                value={form.vaccineName}
                onChange={(event) => setForm((current) => ({ ...current, vaccineName: event.target.value }))}
                placeholder="e.g. Rabies"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vaccination date">
                <input
                  type="date"
                  value={form.vaccinationDate}
                  onChange={(event) => setForm((current) => ({ ...current, vaccinationDate: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Next due date">
                <input
                  type="date"
                  value={form.nextDueDate ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, nextDueDate: event.target.value }))}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Veterinarian">
              <input
                value={form.veterinarianName}
                onChange={(event) => setForm((current) => ({ ...current, veterinarianName: event.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className={`${inputClass} resize-none`}
              />
            </Field>
            {formError && (
              <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditorOpen(false)} className={secondaryButtonClass}>
                Cancel
              </button>
              <button disabled={saving} onClick={() => void save()} className={primaryButtonClass}>
                {saving ? 'Saving...' : 'Save Vaccination'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete vaccination?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-[#6B7280]">This vaccination record will be permanently removed.</p>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className={secondaryButtonClass}>
              Keep Record
            </button>
            <button onClick={() => void confirmDelete()} className={dangerButtonClass}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function OwnerHealthRecords() {
  const { records, loading, error } = useOwnerMedicalRecords()

  const followUps = records.filter((record) => record.follow_up_date)

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Health Records"
          subtitle="Prescriptions, follow-ups, and medical history for your pets"
        />
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <EmptyState icon={<FileText size={26} />} title="Unable to load records" text={error} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<FileText size={26} />}
            title="No prescriptions yet"
            text="Prescriptions issued by your veterinarian appear here."
          />
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <PrescriptionCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>

      {followUps.length > 0 && (
        <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#111827]">
            <CalendarCheck size={18} className="text-[#16A34A]" /> Upcoming follow-ups
          </h3>
          <div className="space-y-2">
            {followUps.map((record) => (
              <p key={`follow-${record.id}`} className="text-sm text-[#374151]">
                {record.pet_name} · {formatDate(record.follow_up_date)} · {record.vet_name}
              </p>
            ))}
          </div>
        </section>
      )}

      <VaccinationRecords />
      <MedicalTimelineScreen />
    </div>
  )
}

function PrescriptionCard({ record }: { record: MedicalRecord }) {
  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-[#111827]">
            {record.pet_name} — {record.diagnosis}
          </p>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {formatDate(record.appointment_date ?? record.created_at)} · {record.vet_name} ·{' '}
            {record.clinic_name}
          </p>
        </div>
        <PdfActions
          compact
          onAction={(action) => generatePrescriptionPDF(record, action)}
        />
      </div>
      <p className="mt-3 whitespace-pre-line text-sm text-[#374151]">{record.prescription}</p>
      <p className="mt-3 text-xs text-[#6B7280]">
        Follow-up: {formatDate(record.follow_up_date)}
      </p>
    </div>
  )
}

function EventBadge({ type }: { type: TimelineEventType }) {
  const labels: Record<TimelineEventType, [string, string]> = {
    appointment_booked: ['Booked', 'bg-blue-50 text-blue-600'],
    appointment_completed: ['Completed', 'bg-[#DCFCE7] text-[#16A34A]'],
    diagnosis_added: ['Diagnosis', 'bg-amber-50 text-amber-700'],
    prescription_issued: ['Prescription', 'bg-purple-50 text-purple-600'],
    vaccination_added: ['Vaccination', 'bg-teal-50 text-teal-700'],
    follow_up_scheduled: ['Follow-up', 'bg-slate-100 text-slate-700'],
  }
  const [label, className] = labels[type]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>{label}</span>
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">{title}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[#374151]">
      {label}
      {children}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#F1F5F9] pt-3">
      <p className="mb-2 text-xs font-semibold uppercase text-[#9CA3AF]">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#9CA3AF]">{label}</p>
      <p className="text-sm font-medium text-[#111827]">{value || '—'}</p>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16A34A]">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B7280]">{text}</p>
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[18px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#F8FAFC]">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-[10px] bg-[#E5E7EB]" />
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 rounded-[14px] border border-[#E5E7EB] bg-white p-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded bg-[#E5E7EB]" />
      ))}
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="mt-1 h-3 w-3 animate-pulse rounded-full bg-[#E5E7EB]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#F1F5F9]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed right-5 top-5 z-[90] rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg"
    >
      {message}
    </div>
  )
}

function emptyVaccinationForm(): VaccinationInput {
  return {
    petName: '',
    ownerId: '',
    vaccineName: '',
    vaccinationDate: new Date().toISOString().slice(0, 10),
    nextDueDate: '',
    veterinarianName: '',
    notes: '',
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

const inputClass =
  'mt-1.5 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]'
const primaryButtonClass =
  'rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D] disabled:opacity-60'
const secondaryButtonClass =
  'rounded-[10px] border border-[#E5E7EB] px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]'
const dangerButtonClass =
  'rounded-[10px] bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600'
const smallButtonClass =
  'inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F8FAFC]'
