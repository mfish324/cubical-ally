import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { userApi, skillsApi } from '@/services/api';
import toast from 'react-hot-toast';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  enableCheckins: z.boolean().optional(),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const {
    currentOccupation,
    targetOccupation,
    skillRatings,
    industry,
    reset: resetOnboarding,
  } = useOnboardingStore();

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      enableCheckins: true,
    },
  });

  // Helper to parse API error responses
  const parseApiError = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: Record<string, string[]> } };
      const data = axiosError.response?.data;
      if (data) {
        // Handle field-specific errors (password1, email, etc.)
        const errors: string[] = [];
        for (const [field, messages] of Object.entries(data)) {
          if (Array.isArray(messages)) {
            errors.push(...messages);
          } else if (typeof messages === 'string') {
            errors.push(messages);
          }
        }
        if (errors.length > 0) {
          return errors.join(' ');
        }
      }
    }
    return 'Registration failed. Please try again.';
  };

  const onSubmit = async (data: SignUpForm) => {
    setServerError('');

    try {
      // Register the user
      await registerUser(data.email, data.password);

      // Save onboarding data to their profile
      if (currentOccupation || targetOccupation) {
        await userApi.updateProfile({
          current_occupation_code: currentOccupation?.onet_soc_code || '',
          current_occupation_title: currentOccupation?.title || '',
          target_occupation_code: targetOccupation?.onet_soc_code || '',
          target_occupation_title: targetOccupation?.title || '',
          industry: industry || '',
          checkin_enabled: data.enableCheckins || false,
        });
      }

      // Save skill ratings
      if (skillRatings.length > 0) {
        const skills = skillRatings.map((r) => ({
          skill: r.skillId.startsWith('custom-') ? undefined : r.skillId,
          skill_name: r.skillName,
          proficiency: r.proficiency,
          is_custom: r.skillId.startsWith('custom-'),
        }));

        await skillsApi.bulkUpdateSkills(skills);
      }

      // Clear onboarding state
      resetOnboarding();

      toast.success('Welcome to CubicleAlly!');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      setServerError(parseApiError(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="full" size="lg" className="mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Save your progress and build your case
          </h1>
        </div>

        <Card className="mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {serverError}
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
            />

            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a strong password"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              error={errors.password?.message}
              helperText="At least 8 characters. Avoid common passwords like 'password123'."
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('enableCheckins')}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                Send me weekly check-ins to stay on track
              </span>
            </label>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Create my CubicleAlly account
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* OAuth buttons (placeholder) */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled
            >
              Continue with LinkedIn
            </Button>
          </form>
        </Card>

        {/* Privacy Promise */}
        <Card className="bg-primary-50 border-primary-200 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                The CubicleAlly Privacy Promise
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Your career planning is YOUR business.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• We never share your data with employers</li>
                <li>• We never sell your information</li>
                <li>• You can delete everything anytime</li>
              </ul>
              <a
                href="/privacy"
                className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
              >
                Read our full privacy commitment →
              </a>
            </div>
          </div>
        </Card>

        {/* Login link */}
        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
