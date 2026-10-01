import { Download, Eye, Printer } from 'lucide-react'

import type { PdfAction } from '@/services/pdf'

export function PdfActions({
  onAction,
  disabled = false,
  compact = false,
}: {
  onAction: (action: PdfAction) => void | Promise<void>
  disabled?: boolean
  compact?: boolean
}) {
  const run = (action: PdfAction) => {
    void Promise.resolve(onAction(action)).catch(() => undefined)
  }

  const buttonClass = compact
    ? 'inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-50'
    : 'inline-flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-50'

  return (
    <div className={`flex ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <button disabled={disabled} onClick={() => run('view')} className={buttonClass}>
        <Eye size={compact ? 12 : 13} /> View PDF
      </button>
      <button disabled={disabled} onClick={() => run('download')} className={buttonClass}>
        <Download size={compact ? 12 : 13} /> Download
      </button>
      <button disabled={disabled} onClick={() => run('print')} className={buttonClass}>
        <Printer size={compact ? 12 : 13} /> Print
      </button>
    </div>
  )
}
