export interface StaffMember {
  id: string;
  name: string;
  position: string;
  department: string;
  photoUrl: string;
  bio: string;
  officeHours: string;
  email: string;
  phone: string;
  location: string;
}

export type SortField = 'name' | 'department';
export type SortDirection = 'asc' | 'desc';