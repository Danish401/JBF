/** Column: BUYER */
export interface SalesOrderBuyer {
  name: string
  addressLines: string[]
  contactPerson: string
  phone: string
  fax: string
  email: string
  poNo: string
  poDate: string
  deliveryTerms: string
  paymentTerms: string
  trn: string
}

/** Column: BILL TO PARTY (If other than Buyer) */
export interface SalesOrderBillToParty {
  name: string
  addressLines: string[]
  contactPerson: string
  phone: string
  fax: string
  email: string
  countryOfOrigin: string
  finalDestination: string
  palletShippingMark: string
  materialDescription: string
  trn: string
}

/** Column: CONSIGNEE */
export interface SalesOrderConsignee {
  name: string
  addressLines: string[]
  contactPerson: string
  phone: string
  fax: string
  email: string
  portOfLoading: string
  portOfDischarge: string
  countryOfFinalDestination: string
  modeOfShipment: string
  trn: string
}

export interface SalesOrderHeader {
  /** Seller / exporter (shown under logo, top-left) */
  sellerCompanyName: string
  sellerAddressLines: string[]
  sellerTel: string
  sellerFax: string
  sellerTrn: string
  salesOrderNo: string
  salesOrderDate: string
  /** Revisions / amendments */
  revisions: string
}

export interface SalesOrderLineItem {
  srNo: number
  customerReference: string
  type: string
  thickness: string
  core: string
  width: string
  length: string
  treatmentIn: string
  treatmentOut: string
  opticalDensity: string
  quantity: string
  basePriceRateUsd: string
  baseValueUsd: string
  /** Tax rate for the line, e.g. "10%" (from Zoho line tax %) */
  taxPercent: string
  totalUsd: string
}

export interface SalesOrderTotals {
  subTotal: string
  tariffLabel: string
  tariffAmount: string
  grandTotal: string
  amountInWords: string
}

export interface SalesOrderFooter {
  leftSignatoryLabel: string
  rightSignatoryLabel: string
  pageNumber: string
}

export interface SalesOrderViewModel {
  header: SalesOrderHeader
  buyer: SalesOrderBuyer
  billToParty: SalesOrderBillToParty
  consignee: SalesOrderConsignee
  lineItems: SalesOrderLineItem[]
  totals: SalesOrderTotals
  notifyingParty: string
  remarks: string[]
  additionalRemarks: string
  shipmentLine: string
  footer: SalesOrderFooter
}

export const DEFAULT_SALES_ORDER_VIEW: SalesOrderViewModel = {
  header: {
    sellerCompanyName: 'JBF BAHRAIN W.L.L.',
    sellerAddressLines: [
      'Bldg 461, Road 1508, Block 115, Al Hidd, B.I.I.P.,',
      'Salman Ind. City, Bahrain.',
    ],
    sellerTel: '+97317181500',
    sellerFax: '+97317181600',
    sellerTrn: '200000799300002',
    salesOrderNo: '7020035309',
    salesOrderDate: '09.06.2025',
    revisions: '',
  },
  buyer: {
    name: 'SAMPLE BUYER LTD.',
    addressLines: ['P.O. Box 00000', 'Sample City, Country'],
    contactPerson: 'Contact Name',
    phone: '+000 0000 0000',
    fax: '',
    email: 'buyer@example.com',
    poNo: 'PO-2025-001',
    poDate: '01.06.2025',
    deliveryTerms: 'CIF',
    paymentTerms: '90 DAYS FROM INVOICE DATE',
    trn: '',
  },
  billToParty: {
    name: 'SAMPLE BILL TO PARTY',
    addressLines: ['Same as buyer or alternate address'],
    contactPerson: '',
    phone: '',
    fax: '',
    email: '',
    countryOfOrigin: 'BAHRAIN',
    finalDestination: '',
    palletShippingMark: '',
    materialDescription: '',
    trn: '',
  },
  consignee: {
    name: 'SAMPLE CONSIGNEE',
    addressLines: ['Port delivery address line 1', 'Line 2'],
    contactPerson: '',
    phone: '',
    fax: '',
    email: '',
    portOfLoading: 'KHALIFA BIN SALMAN PORT',
    portOfDischarge: '',
    countryOfFinalDestination: '',
    modeOfShipment: 'SEA',
    trn: '',
  },
  lineItems: [
    {
      srNo: 1,
      customerReference: 'REF-001',
      type: 'BOPET',
      thickness: '12 µm',
      core: '6"',
      width: '1050 mm',
      length: '12,000 m',
      treatmentIn: '',
      treatmentOut: '',
      opticalDensity: '',
      quantity: '1.000',
      basePriceRateUsd: '1.2500',
      baseValueUsd: '34,280.00',
      taxPercent: '10%',
      totalUsd: '37,708.00',
    },
  ],
  totals: {
    subTotal: '34,280.00',
    tariffLabel: 'Tariff 10%',
    tariffAmount: '3,428.00',
    grandTotal: '37,708.00',
    amountInWords: 'USD THIRTY-FOUR THOUSAND TWO HUNDRED EIGHTY ONLY',
  },
  notifyingParty: '',
  remarks: [
    'Packing Sea Worthy.',
    'Quantity & Value Tolerance +/- 10%.',
    'JBF Label.',
    'Certificate of Analysis.',
    'ISPM-15 Heat Treatment Certificate.',
    'Customer PO and Date Should be mentioned on all documents.',
  ],
  additionalRemarks:
    'All prices quoted are exclusive of any applicable import tariffs & fees, which are the responsibility of the buyer.',
  shipmentLine: 'SHIPMENT: ETD BAHRAIN _______________ & ETA TO CUSTOMER WILL BE _______________',
  footer: {
    leftSignatoryLabel: 'AUTHORISED SIGNATORY OF JBF BAHRAIN W.L.L',
    rightSignatoryLabel: 'AUTHORISED SIGNATORY OF BUYER',
    pageNumber: 'Page 1/1',
  },
}
