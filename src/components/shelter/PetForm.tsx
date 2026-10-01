import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ImagePlus } from 'lucide-react'
import { z } from 'zod'

import {
  createPet,
  updatePet,
  uploadPetImage,
  type Pet,
  type PetInput,
} from '@/services/pets'

const petSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  species: z.string().trim().min(1, 'Species is required'),
  breed: z.string().trim().min(1, 'Breed is required'),
  age: z.number().positive('Age must be greater than zero'),
  gender: z.string().trim().min(1, 'Gender is required'),
  vaccinated: z.boolean(),
  health_notes: z.string(),
  status: z.enum(['Available', 'Reserved', 'Adopted']),
})

type PetFormValues = z.infer<typeof petSchema>

interface PetFormProps {
  pet?: Pet | null
  onSaved: () => void
  onCancel: () => void
}

export function ShelterPetForm({ pet, onSaved, onCancel }: PetFormProps) {
  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: '',
      species: 'Dog',
      breed: '',
      age: 1,
      gender: 'Male',
      vaccinated: false,
      health_notes: '',
      status: 'Available',
    },
  })

  useEffect(() => {
    if (!pet) return
    reset({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      vaccinated: pet.vaccinated,
      health_notes: pet.health_notes,
      status: pet.status,
    })
  }, [pet, reset])

  const steps = [
    'Basic Info',
    'Health Details',
    'Adoption Status',
    'Photo',
    'Publish',
  ]

  const continueForm = async () => {
    if (step === 1) {
      const valid = await trigger([
        'name',
        'species',
        'breed',
        'age',
        'gender',
      ])
      if (!valid) return
    }
    setStep((current) => Math.min(5, current + 1))
  }

  const onSubmit = async (values: PetFormValues) => {
    if (!pet && !imageFile) {
      setNotice({ type: 'error', message: 'Choose a pet image before publishing.' })
      setStep(4)
      return
    }

    setSubmitting(true)
    setNotice(null)
    try {
      let imageUrl = pet?.image_url ?? null
      let imagePath = pet?.image_path ?? null

      if (imageFile) {
        const uploaded = await uploadPetImage(imageFile)
        imageUrl = uploaded.imageUrl
        imagePath = uploaded.imagePath
      }

      const input: PetInput = {
        ...values,
        image_url: imageUrl,
        image_path: imagePath,
      }

      if (pet) {
        await updatePet(pet.id, input, pet.image_path)
      } else {
        await createPet(input)
      }

      setNotice({
        type: 'success',
        message: pet ? 'Pet listing updated successfully.' : 'Pet listing published successfully.',
      })
      window.setTimeout(onSaved, 700)
    } catch (saveError) {
      setNotice({
        type: 'error',
        message:
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save the pet listing.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {notice && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-[80] rounded-[12px] border px-4 py-3 text-sm font-medium shadow-lg ${
            notice.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">
          {pet ? 'Edit Pet' : 'Add a Pet'}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {pet ? 'Update this adoption listing' : 'List a new pet for adoption'}
        </p>
      </div>

      <div className="mb-8 flex items-center gap-0">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  index <= step - 1
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#E5E7EB] text-[#9CA3AF]'
                }`}
              >
                {index < step - 1 ? <Check size={13} /> : index + 1}
              </div>
              <p className="mt-1 w-16 text-center text-[10px] text-[#9CA3AF]">
                {label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mb-4 h-0.5 flex-1 ${
                  index < step - 1 ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-[14px] border border-[#E5E7EB] bg-white p-6"
      >
        {step === 1 && (
          <div>
            <h3 className="mb-4 font-semibold text-[#111827]">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pet Name" error={errors.name?.message}>
                <input {...register('name')} placeholder="e.g. Buddy" className={inputClass} />
              </Field>
              <Field label="Breed" error={errors.breed?.message}>
                <input {...register('breed')} placeholder="e.g. Labrador" className={inputClass} />
              </Field>
              <Field label="Age" error={errors.age?.message}>
                <input {...register('age', { valueAsNumber: true })} type="number" min="0.1" step="0.1" className={inputClass} />
              </Field>
              <Field label="Species" error={errors.species?.message}>
                <select {...register('species')} className={inputClass}>
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Rabbit</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Gender" error={errors.gender?.message}>
                <select {...register('gender')} className={inputClass}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Unknown</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#111827]">Health Details</h3>
            <Field label="Health Notes">
              <textarea {...register('health_notes')} rows={5} className={`${inputClass} resize-none`} />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input {...register('vaccinated')} type="checkbox" className="h-4 w-4 accent-[#16A34A]" />
              <span className="text-sm font-medium text-[#374151]">Vaccinated</span>
            </label>
          </div>
        )}

        {step === 3 && (
          <Field label="Adoption Status">
            <select {...register('status')} className={inputClass}>
              <option>Available</option>
              <option>Reserved</option>
              <option>Adopted</option>
            </select>
          </Field>
        )}

        {step === 4 && (
          <div>
            <h3 className="mb-4 font-semibold text-[#111827]">Upload Photo</h3>
            <label className="block cursor-pointer rounded-[14px] border-2 border-dashed border-[#E5E7EB] p-12 text-center transition-colors hover:border-[#16A34A]">
              <ImagePlus className="mx-auto text-[#16A34A]" size={32} />
              <p className="mt-3 text-sm font-medium text-[#374151]">
                {imageFile?.name ?? (pet?.image_url ? 'Choose a replacement image' : 'Click to upload an image')}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">JPG or PNG, maximum 5MB</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  if (file && file.size > 5 * 1024 * 1024) {
                    setNotice({ type: 'error', message: 'Image must be smaller than 5MB.' })
                    return
                  }
                  setImageFile(file)
                }}
              />
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
              <Check className="text-[#16A34A]" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[#111827]">
              Ready to {pet ? 'Update' : 'Publish'}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-[#6B7280]">
              Review your pet listing before saving it for adoption.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-[#F1F5F9] pt-5">
          <button
            type="button"
            onClick={() => (step === 1 ? onCancel() : setStep((current) => current - 1))}
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827]"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 5 ? (
            <button type="button" onClick={() => void continueForm()} className={primaryButtonClass}>
              Continue →
            </button>
          ) : (
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? 'Saving...' : pet ? 'Update Listing' : 'Publish Listing'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#111827]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputClass =
  'w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#16A34A]'

const primaryButtonClass =
  'rounded-[10px] bg-[#16A34A] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15803D] disabled:opacity-60'
