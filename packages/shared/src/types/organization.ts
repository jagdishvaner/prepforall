export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}
