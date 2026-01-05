import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function ConfirmRole() {
  const navigate = useNavigate();
  const { currentOccupation, setStep } = useOnboardingStore();

  if (!currentOccupation) {
    navigate('/');
    return null;
  }

  const handleConfirm = () => {
    setStep(2);
    navigate('/onboarding/skills');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="full" size="md" className="mb-6" />

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* Main Card */}
        <Card className="text-center">
          <p className="text-gray-500 mb-2">You selected:</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {currentOccupation.title}
          </h1>

          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            {currentOccupation.description}
          </p>

          <div className="mb-8">
            <p className="text-lg font-medium text-gray-900 mb-4">
              Does this sound like your job?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleConfirm}
                size="lg"
                leftIcon={<CheckCircle className="w-5 h-5" />}
              >
                Yes, that's me
              </Button>
              <Button
                onClick={handleBack}
                variant="secondary"
                size="lg"
              >
                Not quite, let me adjust
              </Button>
            </div>
          </div>

          {/* Optional Industry Selection */}
          <details className="text-left border-t pt-6">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Want more tailored results? (Optional)
            </summary>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your industry
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20">
                <option value="">Select an industry...</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance & Banking</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="consulting">Consulting</option>
                <option value="education">Education</option>
                <option value="government">Government</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="other">Other</option>
              </select>
            </div>
          </details>
        </Card>

        {/* Back Link */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mt-6 mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to search
        </button>
      </div>
    </div>
  );
}
