/**
 * Organization ID used by Zoho Books and Zoho Inventory APIs (same value in linked orgs).
 */
export function getZohoOrganizationId(): string {
  return (
    process.env.ZOHO_ORGANIZATION_ID?.trim() ||
    process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim() ||
    ''
  )
}
