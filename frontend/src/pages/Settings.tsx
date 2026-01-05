import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Bell,
  Target,
  LogOut,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Badge,
} from '@/components/ui';
import { userApi, authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';

const profileSchema = z.object({
  industry: z.string().optional(),
  years_in_current_role: z.coerce.number().min(0).max(50).optional(),
});

const checkinSchema = z.object({
  checkin_enabled: z.boolean(),
  checkin_day: z.coerce.number().min(0).max(6),
  checkin_time: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type CheckinFormData = z.infer<typeof checkinSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileSaved, setProfileSaved] = useState(false);
  const [checkinSaved, setCheckinSaved] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          industry: profile.industry || '',
          years_in_current_role: profile.years_in_current_role || undefined,
        }
      : undefined,
  });

  const {
    register: registerCheckin,
    handleSubmit: handleCheckinSubmit,
    watch: watchCheckin,
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    values: profile
      ? {
          checkin_enabled: profile.checkin_enabled,
          checkin_day: profile.checkin_day ?? 5,
          checkin_time: profile.checkin_time ?? '09:00',
        }
      : undefined,
  });

  const checkinEnabled = watchCheckin('checkin_enabled');

  const profileMutation = useMutation({
    mutationFn: (data: Partial<ProfileFormData>) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (data: CheckinFormData) => userApi.updateCheckinSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setCheckinSaved(true);
      setTimeout(() => setCheckinSaved(false), 2000);
    },
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors, still logout locally
    }
    logout();
    navigate('/login');
  };

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900">
                {user?.first_name} {user?.last_name}
                {!user?.first_name && !user?.last_name && (
                  <span className="text-gray-400">Not set</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Plan</label>
              <Badge variant={user?.subscription_tier === 'pro' ? 'primary' : 'neutral'}>
                {user?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Career Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-500" />
              Career Profile
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleProfileSubmit((data) => profileMutation.mutate(data))}>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Current Role
                </label>
                <p className="text-gray-900">
                  {profile?.current_occupation_title || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </p>
                <Link
                  to="/onboarding/interpret"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Change role
                </Link>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Target Role
                </label>
                <p className="text-gray-900">
                  {profile?.target_occupation_title || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </p>
                <Link
                  to="/onboarding/target"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Change target
                </Link>
              </div>

              <Input
                label="Industry"
                placeholder="e.g., Technology, Healthcare, Finance"
                {...registerProfile('industry')}
                error={profileErrors.industry?.message}
              />

              <Input
                type="number"
                label="Years in Current Role"
                min={0}
                max={50}
                {...registerProfile('years_in_current_role')}
                error={profileErrors.years_in_current_role?.message}
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                isLoading={profileMutation.isPending}
                leftIcon={
                  profileSaved ? (
                    <CheckCircle2 className="w-4 h-4 text-secondary-500" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }
              >
                {profileSaved ? 'Saved!' : 'Save Profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Check-in Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              Weekly Check-ins
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleCheckinSubmit((data) => checkinMutation.mutate(data))}>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Enable check-in reminders</p>
                  <p className="text-sm text-gray-500">
                    Get prompted weekly to capture your wins
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...registerCheckin('checkin_enabled')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {checkinEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Day
                    </label>
                    <select
                      {...registerCheckin('checkin_day')}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none"
                    >
                      {dayLabels.map((day, i) => (
                        <option key={i} value={i}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    type="time"
                    label="Preferred Time"
                    {...registerCheckin('checkin_time')}
                  />
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                isLoading={checkinMutation.isPending}
                leftIcon={
                  checkinSaved ? (
                    <CheckCircle2 className="w-4 h-4 text-secondary-500" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }
              >
                {checkinSaved ? 'Saved!' : 'Save Preferences'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Logout */}
        <Card className="border-red-100">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sign out</p>
                <p className="text-sm text-gray-500">Sign out of your account on this device</p>
              </div>
              <Button variant="danger" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
