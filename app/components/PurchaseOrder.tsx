import Image from 'next/image'
import type { ReactNode } from 'react'
import './PurchaseOrder.css'
import {
  DEFAULT_PURCHASE_ORDER_VIEW,
  type PurchaseOrderViewModel,
} from '@/lib/purchase-order-view-model'

export interface PurchaseOrderProps {
  /** When omitted, the built-in sample document is shown. */
  data?: PurchaseOrderViewModel
}

function commaSeparatedAddress(lines: string[]): string {
  return lines.map((s) => s.trim()).filter(Boolean).join(', ')
}

function isBlank(value: ReactNode): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

interface PartyKvRowProps {
  label: string
  value: ReactNode
  multiline?: boolean
  valueBold?: boolean
  rowBold?: boolean
  /** Bill/Ship columns: hide label + colon but keep grid width to align with Supplier */
  hideLabel?: boolean
}

function PartyKvRow({ label, value, multiline, valueBold, rowBold, hideLabel }: PartyKvRowProps) {
  const blank = isBlank(value)
  const inner = blank ? (
    <span className="purchase-order__sk-placeholder" aria-hidden="true">
      {'\u00a0'}
    </span>
  ) : (
    value
  )
  return (
    <div
      className={[
        'purchase-order__supplier-kv',
        multiline ? 'purchase-order__supplier-kv--multiline' : '',
        rowBold ? 'purchase-order__supplier-kv--bold' : '',
        hideLabel ? 'purchase-order__supplier-kv--hide-label' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="purchase-order__sk-label">{label}</span>
      <span className="purchase-order__sk-colon" aria-hidden="true">
        :
      </span>
      <span
        className={[
          'purchase-order__sk-value',
          valueBold && !rowBold ? 'purchase-order__sk-value--party-strong' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {inner}
      </span>
    </div>
  )
}

export default function PurchaseOrder({ data = DEFAULT_PURCHASE_ORDER_VIEW }: PurchaseOrderProps) {
  const { header, supplier, billTo, shipTo, lineItems, totals, remarks, footer } = data

  const billAddressLine = commaSeparatedAddress(billTo.addressLines)
  const shipAddressLine = commaSeparatedAddress(shipTo.addressLines)

  return (
    <article className="purchase-order" aria-label="Purchase order">
      <table className="purchase-order__doc-print-wrap" role="presentation">
        <thead className="purchase-order__doc-print-thead">
          <tr>
            <td className="purchase-order__doc-print-thead-cell">
              <header className="purchase-order__header">
        <div className="purchase-order__header-logo-cell">
          <div className="purchase-order__logo">
            <Image
              src="/OIP.webp"
              alt="JBF Bahrain"
              fill
              className="purchase-order__logo-img"
              sizes="(max-width: 1100px) 22vw, 200px"
              priority
            />
          </div>
        </div>
        <div className="purchase-order__header-center-cell">
          <h2 className="purchase-order__doc-title">PURCHASE ORDER</h2>
          <div className="purchase-order__header-company-block">
            <p className="purchase-order__company-name">{header.companyName}</p>
            <p className="purchase-order__company-address">{header.address}</p>
          </div>
        </div>
        <div className="purchase-order__header-po-cell">
          <div className="purchase-order__po-rows">
            <p className="purchase-order__po-line">
              <span className="purchase-order__po-label">PO Number</span>
              <span className="purchase-order__po-sep"> : </span>
              <span className="purchase-order__po-val">{header.poNumber}</span>
            </p>
            <p className="purchase-order__po-line">
              <span className="purchase-order__po-label">PO Date</span>
              <span className="purchase-order__po-sep"> : </span>
              <span className="purchase-order__po-val">{header.poDate}</span>
            </p>
          </div>
        </div>
              </header>
            </td>
          </tr>
        </thead>
        <tbody className="purchase-order__doc-print-tbody">
          <tr>
            <td className="purchase-order__doc-print-tbody-cell">
              <div className="purchase-order__main">
      <section className="purchase-order__parties" aria-label="Parties">
        <div className="purchase-order__watermark purchase-order__watermark--parties" aria-hidden>
          DRAFT
        </div>

        <table className="purchase-order__parties-table">
          <thead>
            <tr>
              <th scope="col" className="purchase-order__parties-th">
                SUPPLIER
              </th>
              <th scope="col" className="purchase-order__parties-th">
                BILL TO
              </th>
              <th scope="col" className="purchase-order__parties-th">
                SHIP TO:
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Supplier Name" value={supplier.name} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Supplier Name" value={billTo.name} valueBold />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Supplier Name" value={shipTo.name} valueBold />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow
                  label="Address"
                  multiline
                  value={
                    <>
                      {supplier.addressLines.map((line, i) => (
                        <span key={i} className="purchase-order__sk-address-line">
                          {line}
                        </span>
                      ))}
                    </>
                  }
                />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Address" value={billAddressLine} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Address" value={shipAddressLine} />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="TRN No." value={supplier.trn} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="TRN No." value={billTo.trn} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="TRN No." value={shipTo.trn ?? ''} />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Phone" value={supplier.phone} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Phone" value={billTo.phone} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Phone" value={shipTo.phone} />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Fax" value={supplier.fax} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Fax" value={billTo.fax} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Fax" value="" />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Contact Person" value={supplier.contact} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Contact Person" value="" />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Contact Person" value="" />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Mail ID" value={supplier.email} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Mail ID" value="" />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow hideLabel label="Mail ID" value="" />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr purchase-order__parties-tr--bottom">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Delivery terms" value={supplier.deliveryTerms} rowBold />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Country Of Origin" value={billTo.countryOfOrigin ?? ''} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Country Of Dest." value={shipTo.countryOfDestination ?? ''} />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr purchase-order__parties-tr--bottom">
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Payment Terms" value={supplier.paymentTerms} rowBold />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Port of Loading" value={billTo.portOfLoading ?? ''} />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Port of Discharge" value={shipTo.portOfDischarge ?? ''} />
              </td>
            </tr>
            <tr className="purchase-order__parties-tr purchase-order__parties-tr--bottom">
              <td className="purchase-order__parties-td purchase-order__parties-td--spacer">
                <div className="purchase-order__parties-cell-spacer" aria-hidden="true" />
              </td>
              <td className="purchase-order__parties-td purchase-order__parties-td--spacer">
                <div className="purchase-order__parties-cell-spacer" aria-hidden="true" />
              </td>
              <td className="purchase-order__parties-td">
                <PartyKvRow label="Currency" value={shipTo.currency} rowBold />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="purchase-order__items-wrap" aria-label="Line items">
        <table className="purchase-order__table">
          <thead>
            <tr>
              <th className="purchase-order__col-sr">Sr. No.</th>
              <th className="purchase-order__col-code">Item Code</th>
              <th className="purchase-order__col-desc">Description of Goods</th>
              <th className="purchase-order__col-uom">UOM</th>
              <th className="purchase-order__col-qty">Quantity</th>
              <th className="purchase-order__col-price">Unit Price</th>
              <th className="purchase-order__col-gross">Gross Value</th>
              <th className="purchase-order__col-net">Net Value</th>
            </tr>
          </thead>
          <tbody className="purchase-order__tbody-items">
            {lineItems.map((row, idx) => (
              <tr key={`${row.srNo}-${idx}`}>
                <td className="purchase-order__col-sr">{row.srNo}</td>
                <td className="purchase-order__text-left">{row.itemCode}</td>
                <td className="purchase-order__text-left">{row.description}</td>
                <td className="purchase-order__col-uom">{row.uom}</td>
                <td className="purchase-order__text-right">{row.quantity}</td>
                <td className="purchase-order__text-right">{row.unitPrice}</td>
                <td className="purchase-order__text-right">{row.grossValue}</td>
                <td className="purchase-order__text-right">{row.netValue}</td>
              </tr>
            ))}
          </tbody>
          <tbody className="purchase-order__tbody-after-items">
            <tr className="purchase-order__summary-row">
              <td colSpan={6} />
              <td className="purchase-order__summary-label purchase-order__col-gross">Sub Total</td>
              <td className="purchase-order__summary-value purchase-order__col-net">{totals.subTotal}</td>
            </tr>
            <tr className="purchase-order__summary-row purchase-order__summary-row--total">
              <td colSpan={6} />
              <td className="purchase-order__summary-label purchase-order__col-gross">Total Amount</td>
              <td className="purchase-order__summary-value purchase-order__col-net">{totals.totalAmount}</td>
            </tr>
            <tr className="purchase-order__amount-words">
              <td colSpan={8}>Amount In Words : {totals.amountInWords}</td>
            </tr>
            <tr className="purchase-order__remarks-row" aria-label="Remarks">
              <td colSpan={8} className="purchase-order__remarks-cell">
                <div className="purchase-order__remarks-print-stack">
                  <div className="purchase-order__watermark" aria-hidden>
                    DRAFT
                  </div>
                  <div className="purchase-order__remarks-inner">
                    <h3 className="purchase-order__remarks-title">Remarks:</h3>
                    <ol className="purchase-order__remarks-list">
                      {remarks.map((text, index) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="purchase-order__remarks-print-spacer" aria-hidden="true" />
                  <div className="purchase-order__footer-in-remarks" role="contentinfo">
                    <div className="purchase-order__footer">
                      <div className="purchase-order__footer-left">
                        <p className="purchase-order__footer-label">{footer.preparedByLabel}</p>
                        <p className="purchase-order__footer-value">{footer.preparedByName}</p>
                      </div>
                      <div className="purchase-order__footer-right">
                        <p className="purchase-order__footer-closing">{footer.closing}</p>
                        <p className="purchase-order__footer-company">{footer.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
