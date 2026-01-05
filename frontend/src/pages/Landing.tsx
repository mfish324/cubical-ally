import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Target, FileText, Rocket, Lock, Shield } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { occupationApi } from '@/services/api';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { OccupationSearchResult } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export default function Landing() {
  const navigate = useNavigate();
  const { setCurrentOccupation, reset } = useOnboardingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<OccupationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const searchOccupations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await occupationApi.search(query);
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    searchOccupations(debouncedQuery);
  }, [debouncedQuery, searchOccupations]);

  const handleSelectOccupation = (result: OccupationSearchResult) => {
    reset(); // Clear any previous onboarding data
    setCurrentOccupation(result.occupation);
    setShowDropdown(false);
    navigate('/onboarding/confirm');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectOccupation(results[0]);
    } else if (searchQuery.length >= 3) {
      // No match found, go to interpretation
      navigate('/onboarding/interpret', { state: { title: searchQuery } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Logo variant="full" size="lg" />
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto">
          See exactly what stands between you and your next promotion
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your AI ally for the climb ahead. Free gap analysis in 5 minutes.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto relative">
          <div className="relative">
            <Input
              type="text"
              placeholder="What's your current job title?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              leftIcon={<Search className="w-5 h-5" />}
              className="text-lg py-4 pl-12"
            />

            {/* Dropdown */}
            {showDropdown && results.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-auto">
                {results.map((result) => (
                  <button
                    key={result.occupation.onet_soc_code}
                    type="button"
                    onClick={() => handleSelectOccupation(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{result.occupation.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {result.occupation.description}
                    </p>
                    {result.matched_alias && (
                      <p className="text-xs text-primary-600 mt-1">
                        Also known as: {result.matched_alias}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-4 w-full md:w-auto"
            isLoading={isSearching}
            rightIcon={<span>→</span>}
          >
            Show me my path
          </Button>

          <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-1">
            <Lock className="w-4 h-4" />
            Private. No employer access. Ever.
          </p>
        </form>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          How CubicleAlly works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center p-8">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">See your gaps</h3>
            <p className="text-gray-600 text-sm">
              Find out exactly which skills you need for your next role
            </p>
          </Card>

          <Card className="text-center p-8">
            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Document your wins</h3>
            <p className="text-gray-600 text-sm">
              Build a compelling case with AI-enhanced accomplishments
            </p>
          </Card>

          <Card className="text-center p-8">
            <div className="w-12 h-12 bg-attention-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-attention-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Make your move</h3>
            <p className="text-gray-600 text-sm">
              Generate a promotion-ready document to share with your manager
            </p>
          </Card>
        </div>
      </section>

      {/* AI for You Section */}
      <section className="bg-primary-50 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI that works for YOU</h2>
          <p className="text-gray-600 mb-8">
            Most career tools are built for HR. CubicleAlly is different. We're your private ally —
            here to help you rise, not report on you.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <Card className="p-6 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">✗</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Them</p>
                  <p className="text-gray-600 text-sm">
                    "Assess employees for management"
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-primary-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">CubicleAlly</p>
                  <p className="text-gray-600 text-sm">
                    "Help employees advance their careers"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-4">
          <Shield className="w-4 h-4" />
          Your career data stays yours.
        </div>
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} CubicleAlly | Privacy | Terms
        </p>
      </footer>
    </div>
  );
}
