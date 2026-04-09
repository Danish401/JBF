export interface PurchaseOrderHeader {
  companyName: string
  address: string
  poNumber: string
  poDate: string
}

export interface PurchaseOrderSupplier {
  name: string
  addressLines: string[]
  trn: string
  phone: string
  fax: string
  contact: string
  email: string
  deliveryTerms: string
  paymentTerms: string
}

export interface PurchaseOrderParty {
  name: string
  addressLines: string[]
  trn: string
  phone: string
  fax: string
  /** Zoho custom field `cf_country_of_origin` */
  countryOfOrigin?: string
  /** Zoho custom field `cf_port_of_loading` */
  portOfLoading?: string
}

export interface PurchaseOrderShipTo {
  name: string
  addressLines: string[]
  /** Zoho custom field `cf_trn_no2` */
  trn?: string
  phone: string
  currency: string
  /** Zoho `cf_country_of_final_destination` or `cf_final_destination` */
  countryOfDestination?: string
  /** Zoho custom field `cf_post_of_discharge` */
  portOfDischarge?: string
}

export interface PurchaseOrderLineItem {
  srNo: number
  itemCode: string
  description: string
  uom: string
  quantity: string
  unitPrice: string
  grossValue: string
  netValue: string
}

export interface PurchaseOrderTotals {
  subTotal: string
  totalAmount: string
  amountInWords: string
}

export interface PurchaseOrderFooter {
  preparedByLabel: string
  preparedByName: string
  closing: string
  company: string
}

export interface PurchaseOrderViewModel {
  header: PurchaseOrderHeader
  supplier: PurchaseOrderSupplier
  billTo: PurchaseOrderParty
  shipTo: PurchaseOrderShipTo
  lineItems: PurchaseOrderLineItem[]
  totals: PurchaseOrderTotals
  remarks: string[]
  footer: PurchaseOrderFooter
}

export const DEFAULT_PURCHASE_ORDER_VIEW: PurchaseOrderViewModel = {
  header: {
    companyName: 'JBF BAHRAIN W.L.L',
    address:
      'PO Box 50397, Bldg 461, Road 1508, Block 115, Al Hidd, B.I.I.P., Salman Ind.City, Bahrain, Tel: +97317181500, Fax:',
    poNumber: '4510021655',
    poDate: '05.01.2026',
  },
  supplier: {
    name: 'COSMOS PROJECTS TRADING CO.W.L.L',
    addressLines: ['P.O.BOX: 20037, MANAMA,', 'KINGDOM OF BAHRAIN, Bahrain'],
    trn: '200011069800002',
    phone: '97317737437',
    fax: '97317737436',
    contact: 'Asif Khan',
    email: 'cosmotrd@batelco.com.bh',
    deliveryTerms: 'DDP - JBF BAHRAIN W.L.L',
    paymentTerms: '90 DAYS FROM INVOICE DATE',
  },
  billTo: {
    name: 'JBF BAHRAIN W.L.L',
    addressLines: [
      'Bldg 461, Road 1508, Block 115, Al Hidd, B.I.I.P.,',
      'Salman Ind.City, Bahrain',
    ],
    trn: '200000799300002',
    phone: '+97317181500',
    fax: '+97317181600',
  },
  shipTo: {
    name: 'Film Plant (JBF BAHRAIN W.L.L)',
    addressLines: [
      'BIIP, Bldg:461, Rd:1508, Block:115, Al Hidd,',
      'Salman Ind.City, Kingdom of Bahrain',
    ],
    phone: '+973 17181500',
    currency: 'BHD',
  },
  lineItems: [
    {
      srNo: 1,
      itemCode: '15000165',
      description: 'SULPHURIC ACID, COMMERCIAL GRADE',
      uom: 'L',
      quantity: '1,000.000',
      unitPrice: '0.240',
      grossValue: '240.000',
      netValue: '240.000',
    },
  ],
  totals: {
    subTotal: '240.000',
    totalAmount: '240.000',
    amountInWords: 'TWO HUNDRED FORTY BHD Only',
  },
  remarks: [
    '1 PRQ REFERENCE: 1100040103 UTILITY.',
    "2 YOU'RE REFERENCE: CPT/272/AK/25 DATED 31.12.2025",
    '3 SPECIFICATIONS: SULPHURIC ACID AS PER ABOVE.',
    '4 VAT VALUE: @ BHD 24.000 ONLY.',
    '5 DELIVERY: WITHIN THREE TO FIVE DAYS.',
    '6 ALL DISPATCH DOCUMENTS DELIVERY NOTE, INVOICE, TEST CERTIFICATES SHOULD BE PROVIDED AT THE TIME OF DELIVERY OF CONSIGNMENT.',
    '7 MATERIAL ACCEPTANCE: THE ABOVE MATERIALS WILL BE BRAND NEW AND FREE FROM ANY MANUFACTURING DEFECTS AND FAULTY WORKMANSHIP.',
    '8 IF ANY DEFECTS ARE NOTICED ON RECEIPT OF THE MATERIAL AT BUYER END, THE SELLER AT THEIR OWN COST WILL REPLACE THE GOODS WITHIN 15 DAYS OF NOTICE EITHER',
  ],
  footer: {
    preparedByLabel: 'Prepared by',
    preparedByName: 'Ghadeer',
    closing: 'Yours Truly,',
    company: 'JBF BAHRAIN W.L.L',
  },
}
