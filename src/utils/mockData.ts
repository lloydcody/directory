import { StaffMember } from '../types';

export const mockStaffData: StaffMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    bio: 'Sarah is a senior software engineer with over 8 years of experience in full-stack development. She specializes in React and Node.js applications.',
    officeHours: 'Mon-Fri, 9:00 AM - 5:00 PM',
    email: 'sarah.johnson@example.com',
    phone: '(555) 123-4567',
    location: 'Building A, Floor 3'
  },
  {
    id: '2',
    name: 'Michael Chen',
    position: 'Product Manager',
    department: 'Product',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    bio: 'Michael leads product strategy and development, working closely with engineering and design teams to deliver innovative solutions.',
    officeHours: 'Mon-Fri, 8:30 AM - 4:30 PM',
    email: 'michael.chen@example.com',
    phone: '(555) 234-5678',
    location: 'Building B, Floor 2'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    position: 'UX Designer',
    department: 'Design',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    bio: 'Emily is a UX designer passionate about creating intuitive and accessible user experiences. She has a background in psychology and human-computer interaction.',
    officeHours: 'Mon-Thu, 10:00 AM - 6:00 PM',
    email: 'emily.rodriguez@example.com',
    phone: '(555) 345-6789',
    location: 'Building A, Floor 2'
  }
];