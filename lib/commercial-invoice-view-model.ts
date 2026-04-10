export interface CommercialInvoiceParty {
  name: string
  addressLines: string[]
  contactLines?: string[]
}

export interface CommercialInvoiceProductSpec {
  label: string
  value: string
}

export interface CommercialInvoiceLineItem {
  descriptionTitle: string
  descriptionBodyLines: string[]
  hsCodeLine?: string
  /** Rendered as a fixed 3-column grid: TYPE, THICKNESS (GAUGE), WIDTH (INCH) (values may be blank). */
  specs: CommercialInvoiceProductSpec[]
  quantityLbs: string
  unitRateUsd: string
  amountUsd: string
}

export interface CommercialInvoiceTariffLine {
  label: string
  amountUsd: string
}

export interface CommercialInvoiceBankDetails {
  heading: string
  accountName: string
  beneficiaryAddressLines: string[]
  iban: string
  swift: string
  correspondingBank: string
  corrBankSwift: string
}

export interface CommercialInvoiceViewModel {
  exporter: {
    companyName: string
    addressLines: string[]
    tel: string
    fax: string
    trn: string
  }
  invoiceNo: string
  invoiceDateDtd: string
  salesContractNo: string
  salesContractDate: string
  poNo: string
  poDate: string
  consignee: CommercialInvoiceParty
  buyer: CommercialInvoiceParty
  shipping: {
    preCarriedByLeft: string
    preCarriedByRight: string
    vesselNameVoyage: string
    portOfDischarge: string
    portOfLoading: string
    finalDestination: string
  }
  countryOfOrigin: string
  countryOfFinalDestination: string
  termsDeliveryPaymentLines: string[]
  lineItems: CommercialInvoiceLineItem[]
  tariffLines: CommercialInvoiceTariffLine[]
  summaryBlock: {
    originNote?: string
    totalPallets: string
    totalRolls: string
    totalNetLbs: string
    totalNetKgs: string
    totalGrossLbs: string
    totalGrossKgs: string
    shippingMarks: string
  }
  /** Formatted total e.g. 34,560.26 */
  totalAmountUsd: string
  /** Numeric for amount in words */
  totalAmountNumeric: number
  /** ISO code for total row and amount in words (default USD in UI). */
  currencyCode?: string
  footerHsCodeLine?: string
  bank: CommercialInvoiceBankDetails
  declarationText: string
  signatoryBlockTitle: string
  signatoryLabel: string
  /** When set (e.g. Zoho invoice id), shown in print hint / metadata only. */
  sourceZohoInvoiceId?: string
}

/** Sample document matching the JBF Bahrain commercial invoice layout. */
export const DEFAULT_COMMERCIAL_INVOICE_VIEW: CommercialInvoiceViewModel = {
  exporter: {
    companyName: 'JBF BAHRAIN W.L.L.',
    addressLines: ['BLDG 461, ROAD 1508, AL HIDD 115, B.I.I.P, BAHRAIN.'],
    tel: 'TEL: +97317181500',
    fax: 'FAX: +97317181600',
    trn: 'TRN NO. 200000799300002',
  },
  invoiceNo: 'BECI250663',
  invoiceDateDtd: '29.07.2025',
  salesContractNo: '7020035309',
  salesContractDate: '09.06.2025',
  poNo: '0000034586',
  poDate: '05.06.2025',
  consignee: {
    name: 'ROLVAC LP',
    addressLines: ['207 TRACY RD,', '06241, DAYVILLE, CONNECTICUT,', 'USA'],
    contactLines: [
      'Contact Person: Purchaser',
      'Phone: +1 860 774 4000',
      'Fax: +1 860 774 4001',
      'Email: purchasing@rolvac.com',
    ],
  },
  buyer: {
    name: 'ROLVAC LP',
    addressLines: ['207 TRACY RD,', '06241, DAYVILLE, CONNECTICUT,', 'USA'],
    contactLines: [
      'Contact Person: Purchaser',
      'Phone: +1 860 774 4000',
      'Fax: +1 860 774 4001',
      'Email: purchasing@rolvac.com',
    ],
  },
  shipping: {
    preCarriedByLeft: 'BY SEA',
    preCarriedByRight: '',
    vesselNameVoyage: 'VALENCE 0066E',
    portOfDischarge: 'NEW YORK, NY',
    portOfLoading: 'KHALIFA BIN SALMAN PORT, BAHRAIN',
    finalDestination: 'DAYVILLE, CT 06241-USA',
  },
  countryOfOrigin: 'BAHRAIN',
  countryOfFinalDestination: 'USA',
  termsDeliveryPaymentLines: ['DDP, DELIVERY ADDRESS', 'AT 60 DAYS FROM SHIPMENT DATE'],
  lineItems: [
    {
      descriptionTitle: 'PET FILM',
      descriptionBodyLines: [
        'HS CODE: 3920.62.00.90',
        'HTSUS: 3920.62.0090',
      ],
      specs: [
        { label: 'TYPE', value: 'A410' },
        { label: 'THICKNESS (GAUGE)', value: '44.00' },
        { label: 'WIDTH (INCH)', value: '60.000' },
      ],
      quantityLbs: '40,209.93',
      unitRateUsd: '0.79',
      amountUsd: '31,765.84',
    },
  ],
  tariffLines: [{ label: 'Tariff @ 10% on FOB value', amountUsd: '2,794.42' }],
  summaryBlock: {
    originNote: 'EIN NO, GOODS OF BAHRAIN ORIGIN.',
    totalPallets: '21',
    totalRolls: '21',
    totalNetLbs: '40,209.93 LBS',
    totalNetKgs: '18,238.90 KGS',
    totalGrossLbs: '43,876.66 LBS',
    totalGrossKgs: '19,902.10 KGS',
    shippingMarks: '',
  },
  totalAmountUsd: '34,560.26',
  totalAmountNumeric: 34560.26,
  footerHsCodeLine: 'HS CODE: 3920.62.00.90',
  bank: {
    heading: 'CITI BANK USD A/C DETAIL',
    accountName: 'JBF BAHRAIN W.L.L.',
    beneficiaryAddressLines: ['ASKAR INDUSTRIAL AREA, BAHRAIN'],
    iban: 'BHXX XXXX XXXX XXXX XXXX XX',
    swift: 'CITIBHBX',
    correspondingBank: 'CITIBANK N.A., NEW YORK',
    corrBankSwift: 'CITIUS33',
  },
  declarationText:
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  signatoryBlockTitle: 'For JBF BAHRAIN W.L.L.',
  signatoryLabel: 'Authorised Signatory',
}
