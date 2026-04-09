'use client'

export default function CommercialInvoicePrintButton() {
  return (
    <div className="purchase-order-print-actions no-print">
      <div className="purchase-order-print-actions__row">
        <button
          type="button"
          className="purchase-order-print-btn"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>
      <p className="purchase-order-print-hint">
        In the print dialog: set <strong>Orientation</strong> to <strong>Portrait</strong>,{' '}
        <strong>Paper size</strong> to <strong>A4</strong>, <strong>Margins</strong> to{' '}
        <strong>Default</strong>, and turn on <strong>Background graphics</strong> if borders look faint.
      </p>
    </div>
  )
}
