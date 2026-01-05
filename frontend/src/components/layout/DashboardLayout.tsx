import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        readinessScore={profile?.readiness_score ?? undefined}
        targetRole={profile?.target_occupation_title}
      />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
