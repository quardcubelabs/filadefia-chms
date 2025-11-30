import { redirect } from 'next/navigation';

export default function RootPage() {
  // Immediately redirect to login page
  redirect('/login');
}
