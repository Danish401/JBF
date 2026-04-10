import Image from 'next/image'
import type { ReactNode } from 'react'
import './SalesOrder.css'
import {
  DEFAULT_SALES_ORDER_VIEW,
  type SalesOrderViewModel,
} from '@/lib/sales-order-view-model'

export interface SalesOrderProps {
  data?: SalesOrderViewModel
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
  rowBold?: boolean
}

function PartyKvRow({ label, value, multiline, rowBold }: PartyKvRowProps) {
  const blank = isBlank(value)
  const inner = blank ? (
    <span className="sales-order__sk-placeholder" aria-hidden="true">
      {'\u00a0'}
    </span>
  ) : (
    value
  )
  return (
    <div
      className={[
        'sales-order__supplier-kv',
        multiline ? 'sales-order__supplier-kv--multiline' : '',
        rowBold ? 'sales-order__supplier-kv--bold' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="sales-order__sk-label">{label}</span>
      <span className="sales-order__sk-colon" aria-hidden="true">
        :
      </span>
      <span className="sales-order__sk-value">{inner}</span>
    </div>
  )
}

export default function SalesOrder({ data = DEFAULT_SALES_ORDER_VIEW }: SalesOrderProps) {
  const { header, buyer, billToParty, consignee, lineItems, totals, notifyingParty, remarks, additionalRemarks, shipmentLine, footer } =
    data

  return (
    <article className="sales-order" aria-label="Sales order">
      <table className="sales-order__doc-print-wrap" role="presentation">
        <thead className="sales-order__doc-print-thead">
          <tr>
            <td className="sales-order__doc-print-thead-cell">
              <header className="sales-order__header">
                <div className="sales-order__header-logo-cell">
                  <div className="sales-order__logo">
                    <Image
                      src="/OIP.webp"
                      alt="JBF Bahrain"
                      fill
                      className="sales-order__logo-img"
                      sizes="(max-width: 1100px) 22vw, 200px"
                      priority
                    />
                  </div>
                </div>
                <div className="sales-order__header-center-cell">
                  <h2 className="sales-order__doc-title">SALES ORDER</h2>
                  <div className="sales-order__header-seller-block">
                    <p className="sales-order__seller-role">Seller/Exporter</p>
                    <p className="sales-order__seller-company">{header.sellerCompanyName}</p>
                    <div className="sales-order__seller-details">
                      {header.sellerAddressLines.map((line, i) => (
                        <p key={i} className="sales-order__seller-line">
                          {line}
                        </p>
                      ))}
                      <p className="sales-order__seller-line sales-order__seller-line--meta">
                        Tel : {header.sellerTel} Fax : {header.sellerFax} TRN NO.: {header.sellerTrn}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sales-order__header-po-cell">
                  <div className="sales-order__po-rows">
                    <p className="sales-order__po-line">
                      <span className="sales-order__po-label">Sales Order No (E)</span>
                      <span className="sales-order__po-sep"> : </span>
                      <span className="sales-order__po-val">{header.salesOrderNo}</span>
                    </p>
                    <p className="sales-order__po-line">
                      <span className="sales-order__po-label">Sales Order Date</span>
                      <span className="sales-order__po-sep"> : </span>
                      <span className="sales-order__po-val">{header.salesOrderDate}</span>
                    </p>
                    <p className="sales-order__po-line">
                      <span className="sales-order__po-label">Revisions / Amendments</span>
                      <span className="sales-order__po-sep"> : </span>
                      <span className="sales-order__po-val">{header.revisions || '\u00a0'}</span>
                    </p>
                  </div>
                </div>
              </header>
            </td>
          </tr>
        </thead>
        <tbody className="sales-order__doc-print-tbody">
          <tr>
            <td className="sales-order__doc-print-tbody-cell">
              <div className="sales-order__main">
                <section className="sales-order__parties" aria-label="Parties">
                  <div className="sales-order__watermark sales-order__watermark--parties" aria-hidden>
                    DRAFT
                  </div>

                  <table className="sales-order__parties-table">
                    <thead>
                      <tr>
                        <th scope="col" className="sales-order__parties-th">
                          BUYER
                        </th>
                        <th scope="col" className="sales-order__parties-th">
                          BILL TO PARTY (If other than Buyer)
                        </th>
                        <th scope="col" className="sales-order__parties-th">
                          CONSIGNEE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Name" value={buyer.name} rowBold />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Name" value={billToParty.name} rowBold />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Name" value={consignee.name} rowBold />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow
                            label="Address"
                            multiline
                            value={
                              <>
                                {buyer.addressLines.map((line, i) => (
                                  <span key={i} className="sales-order__sk-address-line">
                                    {line}
                                  </span>
                                ))}
                              </>
                            }
                          />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow
                            label="Address"
                            multiline
                            value={
                              <>
                                {billToParty.addressLines.map((line, i) => (
                                  <span key={i} className="sales-order__sk-address-line">
                                    {line}
                                  </span>
                                ))}
                              </>
                            }
                          />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow
                            label="Address"
                            multiline
                            value={
                              <>
                                {consignee.addressLines.map((line, i) => (
                                  <span key={i} className="sales-order__sk-address-line">
                                    {line}
                                  </span>
                                ))}
                              </>
                            }
                          />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Contact Person" value={buyer.contactPerson} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Contact Person" value={billToParty.contactPerson} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Contact Person" value={consignee.contactPerson} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Phone" value={buyer.phone} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Phone" value={billToParty.phone} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Phone" value={consignee.phone} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Fax" value={buyer.fax} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Fax" value={billToParty.fax} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Fax" value={consignee.fax} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Email Id" value={buyer.email} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Email Id" value={billToParty.email} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Email Id" value={consignee.email} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="PO. No" value={buyer.poNo} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Country of Origin" value={billToParty.countryOfOrigin} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Port of Loading" value={consignee.portOfLoading} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="PO. Date" value={buyer.poDate} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Final Destination" value={billToParty.finalDestination} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Port of Discharge" value={consignee.portOfDischarge} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Delivery Terms" value={buyer.deliveryTerms} rowBold />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Pallet Shipping Mark" value={billToParty.palletShippingMark} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow
                            label="Country of Final Destination"
                            value={consignee.countryOfFinalDestination}
                          />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Payment Terms" value={buyer.paymentTerms} rowBold />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Material Description" value={billToParty.materialDescription} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="Mode of Shipment" value={consignee.modeOfShipment} />
                        </td>
                      </tr>
                      <tr className="sales-order__parties-tr sales-order__parties-tr--bottom">
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="TRN No." value={buyer.trn} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="TRN No." value={billToParty.trn} />
                        </td>
                        <td className="sales-order__parties-td">
                          <PartyKvRow label="TRN No." value={consignee.trn} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="sales-order__items-wrap" aria-label="Line items">
                  <table className="sales-order__table">
                    <thead>
                      <tr>
                        <th className="sales-order__col-sr">Sr. No</th>
                        <th className="sales-order__col-custref">Customer Reference</th>
                        <th className="sales-order__col-type">Type</th>
                        <th className="sales-order__col-thick">Thickness</th>
                        <th className="sales-order__col-core">Core</th>
                        <th className="sales-order__col-width">Width</th>
                        <th className="sales-order__col-length">Length</th>
                        <th className="sales-order__col-tin">Treatment In</th>
                        <th className="sales-order__col-tout">Treatment Out</th>
                        <th className="sales-order__col-od">Optical Density</th>
                        <th className="sales-order__col-qty">Quantity</th>
                        <th className="sales-order__col-baserate">Base Price Rate (USD)</th>
                        <th className="sales-order__col-baseval">Base Value (USD)</th>
                        <th className="sales-order__col-tax">Tax</th>
                        <th className="sales-order__col-total">Total (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="sales-order__tbody-items">
                      {lineItems.map((row, idx) => (
                        <tr key={`${row.srNo}-${idx}`}>
                          <td className="sales-order__col-sr">{row.srNo}</td>
                          <td className="sales-order__text-left sales-order__col-custref">{row.customerReference}</td>
                          <td className="sales-order__text-left">{row.type}</td>
                          <td className="sales-order__text-left">{row.thickness}</td>
                          <td className="sales-order__text-left">{row.core}</td>
                          <td className="sales-order__text-left">{row.width}</td>
                          <td className="sales-order__text-left">{row.length}</td>
                          <td className="sales-order__text-left">{row.treatmentIn}</td>
                          <td className="sales-order__text-left">{row.treatmentOut}</td>
                          <td className="sales-order__text-left">{row.opticalDensity}</td>
                          <td className="sales-order__text-right">{row.quantity}</td>
                          <td className="sales-order__text-right">{row.basePriceRateUsd}</td>
                          <td className="sales-order__text-right">{row.baseValueUsd}</td>
                          <td className="sales-order__text-right sales-order__col-tax">{row.taxPercent}</td>
                          <td className="sales-order__text-right">{row.totalUsd}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tbody className="sales-order__tbody-after-items">
                      <tr className="sales-order__summary-row">
                        <td colSpan={13} />
                        <td className="sales-order__summary-label sales-order__col-tax">Sub Total</td>
                        <td className="sales-order__summary-value sales-order__col-total">{totals.subTotal}</td>
                      </tr>
                      <tr className="sales-order__summary-row">
                        <td colSpan={13} />
                        <td className="sales-order__summary-label sales-order__col-tax">{totals.tariffLabel}</td>
                        <td className="sales-order__summary-value sales-order__col-total">{totals.tariffAmount}</td>
                      </tr>
                      <tr className="sales-order__summary-row sales-order__summary-row--total">
                        <td colSpan={13} />
                        <td className="sales-order__summary-label sales-order__col-tax">Grand Total</td>
                        <td className="sales-order__summary-value sales-order__col-total">{totals.grandTotal}</td>
                      </tr>
                      <tr className="sales-order__amount-words">
                        <td colSpan={15}>Amount in Words : {totals.amountInWords}</td>
                      </tr>
                      <tr className="sales-order__notifying-row">
                        <td colSpan={15} className="sales-order__notifying-cell">
                          <span className="sales-order__notifying-label">Notifying Party : </span>
                          <span>{notifyingParty || '\u00a0'}</span>
                        </td>
                      </tr>
                      <tr className="sales-order__remarks-row" aria-label="Remarks">
                        <td colSpan={15} className="sales-order__remarks-cell">
                          <div className="sales-order__remarks-print-stack">
                            <div className="sales-order__watermark" aria-hidden>
                              DRAFT
                            </div>
                            <div className="sales-order__remarks-inner">
                              <h3 className="sales-order__remarks-title">Remarks:</h3>
                              <div className="sales-order__remarks-list">
                                {remarks.map((text, index) => {
                                  const num = String(index + 1).padStart(2, '0')
                                  return (
                                    <p key={index} className="sales-order__remarks-line">
                                      <span className="sales-order__remarks-line-num">{num}</span>
                                      {': '}
                                      <span className="sales-order__remarks-line-text">{text}</span>
                                    </p>
                                  )
                                })}
                              </div>
                              {additionalRemarks ? (
                                <p className="sales-order__additional-remarks">{additionalRemarks}</p>
                              ) : null}
                              {shipmentLine ? (
                                <p className="sales-order__shipment-line">{shipmentLine}</p>
                              ) : null}
                            </div>
                            <div className="sales-order__remarks-print-spacer" aria-hidden="true" />
                            <div className="sales-order__footer-in-remarks" role="contentinfo">
                              <div className="sales-order__footer sales-order__footer--signatures">
                                <div className="sales-order__footer-left">
                                  <p className="sales-order__footer-label">{footer.leftSignatoryLabel}</p>
                                  <div className="sales-order__signatory-space" aria-hidden="true" />
                                </div>
                                <div className="sales-order__footer-right">
                                  <p className="sales-order__footer-label">{footer.rightSignatoryLabel}</p>
                                  <div className="sales-order__signatory-space" aria-hidden="true" />
                                </div>
                              </div>
                              <p className="sales-order__page-number">{footer.pageNumber}</p>
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
