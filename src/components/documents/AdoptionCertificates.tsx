import { useEffect, useState } from 'react'
import { Award, Plus } from 'lucide-react'

import { PdfActions } from '@/components/documents/PdfActions'
import { useShelterApplications } from '@/hooks/useAdoptionApplications'
import type { AdoptionApplication } from '@/services/adoptions'
import { getManagedPetById } from '@/services/pets'
import {
  generateAdoptionCertificatePDF,
  type AdoptionCertificateData,
  type PdfAction,
} from '@/services/pdf'

interface CertificateItem extends AdoptionCertificateData {
  id: string
  certificateNumber: string
}

export function AdoptionCertificates() {
  const { applications, loading, error } = useShelterApplications()
  const [certificates, setCertificates] = useState<CertificateItem[]>([])
  const [building, setBuilding] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const completed = applications.filter(
      (application) => application.status === 'completed',
    )

    const build = async () => {
      setBuilding(true)
      try {
        const items = await Promise.all(
          completed.map(async (application) => toCertificate(application)),
        )
        if (active) setCertificates(items)
      } finally {
        if (active) setBuilding(false)
      }
    }

    void build()
    return () => {
      active = false
    }
  }, [applications])

  const runPdf = async (certificate: CertificateItem, action: PdfAction) => {
    try {
      await generateAdoptionCertificatePDF(certificate, action)
    } catch (pdfError) {
      setNotice(
        pdfError instanceof Error
          ? pdfError.message
          : 'Unable to generate certificate PDF.',
      )
      window.setTimeout(() => setNotice(''), 2500)
    }
  }

  return (
    <div>
      {notice && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[90] rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-lg"
        >
          {notice}
        </div>
      )}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
        <span>Certificates</span>
        <span className="text-[#9CA3AF]">/</span>
        <span className="text-[#111827]">Adoption certificates</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Adoption Certificates</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Issued certificates for completed adoptions
        </p>
      </div>

      {loading || building ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[14px] bg-[#E5E7EB]" />
          ))}
        </div>
      ) : error ? (
        <Empty title="Unable to load certificates" text={error} />
      ) : certificates.length === 0 ? (
        <Empty
          title="No certificates yet"
          text="Complete an adoption application to generate an official certificate."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="rounded-[14px] border border-[#E5E7EB] bg-white p-5"
            >
              <div className="mb-4 rounded-[10px] border-2 border-[#16A34A] bg-[#F0FDF4] p-5 text-center">
                {certificate.petImageUrl ? (
                  <img
                    src={certificate.petImageUrl}
                    alt={certificate.petName}
                    className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#16A34A]">
                    <Award size={18} className="text-white" />
                  </div>
                )}
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#16A34A]">
                  Adoption Certificate
                </p>
                <p className="text-lg font-bold text-[#111827]">{certificate.petName}</p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Adopted by {certificate.adopterName}
                </p>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  {formatDate(certificate.adoptionDate)}
                </p>
                <p className="mt-2 font-mono text-[10px] text-[#9CA3AF]">
                  {certificate.certificateNumber}
                </p>
              </div>
              <PdfActions onAction={(action) => runPdf(certificate, action)} />
            </div>
          ))}
          <div className="flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[#E5E7EB] p-5 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FDF4]">
              <Plus size={18} className="text-[#16A34A]" />
            </div>
            <p className="text-sm font-medium text-[#374151]">Generate Certificate</p>
            <p className="text-xs text-[#9CA3AF]">
              Certificates appear automatically when an adoption is completed
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

async function toCertificate(
  application: AdoptionApplication,
): Promise<CertificateItem> {
  let breed = 'Companion animal'
  let age = '—'
  try {
    const pet = await getManagedPetById(application.pet_id)
    if (pet) {
      breed = pet.breed
      age = `${pet.age} year${pet.age === 1 ? '' : 's'}`
    }
  } catch {
    // Keep fallback breed/age when pet details are unavailable.
  }

  const year = new Date(application.created_at).getFullYear()
  const shortId = application.id.slice(0, 8).toUpperCase()

  return {
    id: application.id,
    petName: application.pet_name,
    breed,
    age,
    adopterName: application.applicant_name,
    shelterName: application.shelter_name,
    adoptionDate: application.created_at,
    petImageUrl: application.pet_image,
    certificateNumber: `PSC-${year}-${shortId}`,
  }
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center">
      <Award className="mx-auto text-[#16A34A]" size={28} />
      <h3 className="mt-3 font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B7280]">{text}</p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}
