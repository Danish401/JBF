'use client'

export default function SalesOrderPrintButton() {
  return (
    <div className="sales-order-print-actions no-print">
      <div className="sales-order-print-actions__row">
        <button
          type="button"
          className="sales-order-print-btn"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>
      <p className="sales-order-print-hint">
        In the print dialog: set <strong>Orientation</strong> to <strong>Landscape</strong>,{' '}
        <strong>Margins</strong> to <strong>Default</strong> (not &quot;None&quot;), and turn on{' '}
        <strong>Background graphics</strong> if column headers look wrong.
      </p>
    </div>
  )
}
