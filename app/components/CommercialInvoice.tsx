import Image from 'next/image'
import type { ReactNode } from 'react'
import { amountToWordsIntegerOnly, usdAmountToCommercialInvoiceWords } from '@/lib/amount-words'
import {
  DEFAULT_COMMERCIAL_INVOICE_VIEW,
  type CommercialInvoiceViewModel,
} from '@/lib/commercial-invoice-view-model'
import './CommercialInvoice.css'

export interface CommercialInvoiceProps {
  data?: CommercialInvoiceViewModel
}

function isBlank(value: ReactNode): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

function BlankOr({ children }: { children: ReactNode }) {
  if (isBlank(children)) {
    return <span className="commercial-invoice__sk-placeholder">{'\u00a0'}</span>
  }
  return <>{children}</>
}

export default function CommercialInvoice({
  data = DEFAULT_COMMERCIAL_INVOICE_VIEW,
}: CommercialInvoiceProps) {
  const ccy = data.currencyCode ?? 'USD'
  const amountWords =
    ccy === 'USD'
      ? usdAmountToCommercialInvoiceWords(data.totalAmountNumeric)
      : amountToWordsIntegerOnly(data.totalAmountNumeric, ccy)

  return (
    <article className="commercial-invoice" aria-label="Commercial invoice">
      <table className="commercial-invoice__doc-print-wrap" role="presentation">
        <thead className="commercial-invoice__doc-print-thead">
          <tr>
            <td className="commercial-invoice__doc-print-thead-cell">
              <table className="commercial-invoice__table" role="presentation">
                <tbody>
                  <tr>
                    <td className="commercial-invoice__header-logo">
                      <div className="commercial-invoice__logo">
                        <Image
                          src="/OIP.webp"
                          alt="JBF Bahrain"
                          fill
                          className="commercial-invoice__logo-img"
                          sizes="80px"
                          priority
                        />
                      </div>
                    </td>
                    <td>
                      <div className="commercial-invoice__title">COMMERCIAL INVOICE</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="commercial-invoice__doc-print-tbody-cell">
              <table className="commercial-invoice__table commercial-invoice__meta-table" role="presentation">
                <colgroup>
                  <col className="commercial-invoice__meta-col" />
                  <col className="commercial-invoice__meta-col" />
                  <col className="commercial-invoice__meta-col" />
                  <col className="commercial-invoice__meta-col" />
                </colgroup>
                <tbody>
                  <tr>
                    <td colSpan={2} className="commercial-invoice__cell-exporter">
                      <span className="commercial-invoice__label">Exporter</span>
                      <div className="commercial-invoice__exporter-block">
                        <p>
                          <strong>{data.exporter.companyName}</strong>
                        </p>
                        {data.exporter.addressLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        <p>{data.exporter.tel}</p>
                        <p>{data.exporter.fax}</p>
                        <p>{data.exporter.trn}</p>
                      </div>
                    </td>
                    <td colSpan={2} className="commercial-invoice__cell-ref-meta" style={{ padding: 0 }}>
                      <table className="commercial-invoice__ref-grid" role="presentation">
                        <tbody>
                          <tr>
                            <td>
                              <div className="commercial-invoice__ref-invoice-block">
                                <div className="commercial-invoice__ref-invoice-label-row">
                                  <span className="commercial-invoice__label commercial-invoice__label--corner">
                                    INVOICE NO. &amp; DATE
                                  </span>
                                  <span className="commercial-invoice__label commercial-invoice__label--corner">
                                    DTD:
                                  </span>
                                </div>
                                <div className="commercial-invoice__ref-invoice-value-row">
                                  <strong className="commercial-invoice__value-text">
                                    {data.invoiceNo}
                                  </strong>
                                  <strong className="commercial-invoice__value-text commercial-invoice__ref-date-value">
                                    {data.invoiceDateDtd}
                                  </strong>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span className="commercial-invoice__label">Sales Contract No &amp; Dated</span>
                              <p style={{ margin: 0 }}>
                                SO NO (E) : <strong>{data.salesContractNo}</strong>
                                {'  '}
                                DATE: <strong>{data.salesContractDate}</strong>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span className="commercial-invoice__label">Other Reference</span>
                              <p style={{ margin: 0 }}>
                                PO NO: <strong>{data.poNo}</strong>
                                {'  '}
                                PO DATE: <strong>{data.poDate}</strong>
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={2} className="commercial-invoice__party-cell">
                      <span className="commercial-invoice__label">Consignee:</span>
                      <div className="commercial-invoice__party-block">
                        <p>
                          <strong>{data.consignee.name}</strong>
                        </p>
                        {data.consignee.addressLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        {data.consignee.contactLines?.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </td>
                    <td colSpan={2} className="commercial-invoice__party-cell">
                      <span className="commercial-invoice__label">Buyer (other than Consignee)</span>
                      <div className="commercial-invoice__party-block">
                        <p>
                          <strong>{data.buyer.name}</strong>
                        </p>
                        {data.buyer.addressLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        {data.buyer.contactLines?.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </td>
                  </tr>

                  <tr className="commercial-invoice__ship-row">
                    <td>
                      <span className="commercial-invoice__label">Pre carried by</span>
                      <div className="commercial-invoice__value-text">
                        <BlankOr>{data.shipping.preCarriedByLeft}</BlankOr>
                      </div>
                    </td>
                    <td>
                      <span className="commercial-invoice__label">Pre carried by</span>
                      <div className="commercial-invoice__value-text">
                        <BlankOr>{data.shipping.preCarriedByRight}</BlankOr>
                      </div>
                    </td>
                    <td>
                      <span className="commercial-invoice__label">Country of origin of goods</span>
                      <div className="commercial-invoice__value-text">{data.countryOfOrigin}</div>
                    </td>
                    <td>
                      <span className="commercial-invoice__label">Country of final Destination</span>
                      <div className="commercial-invoice__value-text">
                        {data.countryOfFinalDestination}
                      </div>
                    </td>
                  </tr>
                  <tr className="commercial-invoice__ship-row">
                    <td>
                      <span className="commercial-invoice__label">Vessel name &amp; Voyage No.</span>
                      <div className="commercial-invoice__value-text">
                        {data.shipping.vesselNameVoyage}
                      </div>
                    </td>
                    <td>
                      <span className="commercial-invoice__label">Port of Loading</span>
                      <div className="commercial-invoice__value-text">
                        {data.shipping.portOfLoading}
                      </div>
                    </td>
                    <td colSpan={2} rowSpan={2} className="commercial-invoice__terms-cell">
                      <span className="commercial-invoice__label">Terms of Delivery and Payment</span>
                      <div className="commercial-invoice__terms-values">
                        {data.termsDeliveryPaymentLines.map((line, li) => (
                          <p
                            key={`${li}-${line}`}
                            className={
                              li === 0
                                ? 'commercial-invoice__terms-line commercial-invoice__terms-line--primary'
                                : 'commercial-invoice__terms-line commercial-invoice__terms-line--secondary'
                            }
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr className="commercial-invoice__ship-row">
                    <td>
                      <span className="commercial-invoice__label">Port of discharge</span>
                      <div className="commercial-invoice__value-text">
                        {data.shipping.portOfDischarge}
                      </div>
                    </td>
                    <td>
                      <span className="commercial-invoice__label">Final destination</span>
                      <div className="commercial-invoice__value-text">
                        {data.shipping.finalDestination}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table
                className="commercial-invoice__table commercial-invoice__table--flush-top"
                role="table"
                aria-label="Goods and amounts"
              >
                <thead>
                  <tr className="commercial-invoice__items-head">
                    <th className="commercial-invoice__col-desc">Description of goods</th>
                    <th className="commercial-invoice__col-qty">Quantity / Lbs</th>
                    <th className="commercial-invoice__col-rate">Unit rate / USD/Lbs</th>
                    <th className="commercial-invoice__col-amt">Amount / USD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lineItems.map((item, idx) => (
                    <tr key={`${idx}-${item.descriptionTitle}`}>
                      <td>
                        <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{item.descriptionTitle}</p>
                        {item.descriptionBodyLines.map((line, li) => (
                          <p key={`${li}-${line}`} style={{ margin: '0 0 2px' }}>
                            {line}
                          </p>
                        ))}
                        {item.specs.length > 0 ? (
                          <table className="commercial-invoice__spec-table" role="presentation">
                            <thead>
                              <tr>
                                {item.specs.map((s) => (
                                  <th key={s.label}>{s.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {item.specs.map((s) => (
                                  <td key={s.label}>{s.value}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        ) : null}
                      </td>
                      <td className="commercial-invoice__num">{item.quantityLbs}</td>
                      <td className="commercial-invoice__num">{item.unitRateUsd}</td>
                      <td className="commercial-invoice__num">{item.amountUsd}</td>
                    </tr>
                  ))}
                  {data.tariffLines.map((t, ti) => (
                    <tr key={`${ti}-${t.label}`}>
                      <td colSpan={3}>{t.label}</td>
                      <td className="commercial-invoice__num">{t.amountUsd}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <div className="commercial-invoice__summary-block">
                        {data.summaryBlock.originNote ? <p>{data.summaryBlock.originNote}</p> : null}
                        <p>Total Pallets: {data.summaryBlock.totalPallets}</p>
                        <p>Total Rolls: {data.summaryBlock.totalRolls}</p>
                        <p>
                          Total Net Weight: {data.summaryBlock.totalNetLbs} / {data.summaryBlock.totalNetKgs}
                        </p>
                        <p>
                          Total Gross Weight: {data.summaryBlock.totalGrossLbs} /{' '}
                          {data.summaryBlock.totalGrossKgs}
                        </p>
                        <p>
                          SHIPPING MARKS: <BlankOr>{data.summaryBlock.shippingMarks}</BlankOr>
                        </p>
                      </div>
                    </td>
                    <td className="commercial-invoice__num" />
                    <td className="commercial-invoice__num" />
                    <td className="commercial-invoice__num" />
                  </tr>
                  <tr className="commercial-invoice__total-row">
                    <td>TOTAL</td>
                    <td />
                    <td className="commercial-invoice__num">{ccy}</td>
                    <td className="commercial-invoice__num">{data.totalAmountUsd}</td>
                  </tr>
                  <tr className="commercial-invoice__words-row">
                    <td colSpan={4}>
                      <span className="commercial-invoice__label" style={{ marginBottom: 4 }}>
                        Total amount (in words)
                      </span>
                      <div>{amountWords}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table
                className="commercial-invoice__table commercial-invoice__table--flush-top"
                role="presentation"
              >
                <tbody>
                  <tr>
                    <td style={{ width: '58%' }}>
                      {data.footerHsCodeLine ? (
                        <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{data.footerHsCodeLine}</p>
                      ) : null}
                      <div className="commercial-invoice__bank-box">
                        <div className="commercial-invoice__bank-box-title">{data.bank.heading}</div>
                        <div className="commercial-invoice__footer-bank">
                          <p>
                            <strong>Account Name:</strong> {data.bank.accountName}
                          </p>
                          <p>
                            <strong>Beneficiary Address:</strong>
                          </p>
                          {data.bank.beneficiaryAddressLines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                          <p>
                            <strong>IBAN Number:</strong> {data.bank.iban}
                          </p>
                          <p>
                            <strong>Swift Code:</strong> {data.bank.swift}
                          </p>
                          <p>
                            <strong>Corresponding Bank:</strong> {data.bank.correspondingBank}
                          </p>
                          <p>
                            <strong>Corr Bank Swift:</strong> {data.bank.corrBankSwift}
                          </p>
                        </div>
                      </div>
                      <p className="commercial-invoice__declaration">{data.declarationText}</p>
                    </td>
                    <td style={{ width: '42%', verticalAlign: 'top' }}>
                      <div
                        className="commercial-invoice__sign-area"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '140px',
                        }}
                      >
                        <div className="commercial-invoice__sign-title">{data.signatoryBlockTitle}</div>
                        <div className="commercial-invoice__sign-label">{data.signatoryLabel}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
