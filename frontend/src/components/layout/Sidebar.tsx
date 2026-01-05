import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Sparkles,
  Trophy,
  FileText,
  Settings,
  LogOut,
  Target,
} from 'lucide-react';
import { Logo } from './Logo';
import { ProgressRing } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'My Skills', href: '/skills', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Evidence & Wins', href: '/evidence', icon: <Trophy className="w-5 h-5" /> },
  { label: 'Promotion Case', href: '/document', icon: <FileText className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

interface SidebarProps {
  readinessScore?: number;
  targetRole?: string;
}

export function Sidebar({ readinessScore, targetRole }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Logo variant="full" size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Readiness Score */}
      {readinessScore !== undefined && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-center mb-3">
            <ProgressRing progress={readinessScore} size="sm" />
          </div>
          {targetRole && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Target:</p>
              <p className="text-sm font-medium text-gray-900 flex items-center justify-center gap-1">
                <Target className="w-3 h-3" />
                {targetRole}
              </p>
              <button className="text-xs text-primary-600 hover:text-primary-700 mt-1">
                Change target
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
