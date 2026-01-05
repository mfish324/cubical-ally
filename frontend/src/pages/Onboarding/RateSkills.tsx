import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Card, CategoryBadge, CareerLoader } from '@/components/ui';
import { occupationApi } from '@/services/api';
import { useOnboardingStore } from '@/stores/onboardingStore';

type Proficiency = 1 | 2 | 3;

interface SkillRatingCardProps {
  skillId: string;
  name: string;
  description: string;
  category: 'knowledge' | 'skill' | 'ability' | 'tool';
  currentRating?: Proficiency;
  onRate: (proficiency: Proficiency) => void;
}

function SkillRatingCard({
  skillId,
  name,
  description,
  category,
  currentRating,
  onRate,
}: SkillRatingCardProps) {
  const proficiencyOptions: { value: Proficiency; label: string }[] = [
    { value: 1, label: 'Rarely' },
    { value: 2, label: 'Sometimes' },
    { value: 3, label: 'Regularly' },
  ];

  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{name}</h3>
            <CategoryBadge category={category} />
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {proficiencyOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onRate(option.value)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              currentRating === option.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function RateSkills() {
  const navigate = useNavigate();
  const {
    currentOccupation,
    availableSkills,
    skillRatings,
    setAvailableSkills,
    setSkillRating,
    setStep,
    getProgress,
  } = useOnboardingStore();

  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');

  // Fetch skills for current occupation
  const { data: occupationSkills, isLoading } = useQuery({
    queryKey: ['occupationSkills', currentOccupation?.onet_soc_code],
    queryFn: () => occupationApi.getSkills(currentOccupation!.onet_soc_code, 2.5),
    enabled: !!currentOccupation?.onet_soc_code,
  });

  useEffect(() => {
    if (occupationSkills) {
      setAvailableSkills(occupationSkills);
    }
  }, [occupationSkills, setAvailableSkills]);

  if (!currentOccupation) {
    navigate('/');
    return null;
  }

  const progress = getProgress();
  const canContinue = progress.rated >= Math.min(10, progress.total * 0.6);

  const handleRate = (skillId: string, skillName: string, proficiency: Proficiency) => {
    setSkillRating(skillId, skillName, proficiency);
  };

  const handleAddCustomSkill = () => {
    if (customSkillName.trim()) {
      const customId = `custom-${Date.now()}`;
      setSkillRating(customId, customSkillName.trim(), 3);
      setCustomSkillName('');
      setShowCustomSkill(false);
    }
  };

  const handleContinue = () => {
    setStep(3);
    navigate('/onboarding/target');
  };

  const handleBack = () => {
    setStep(1);
    navigate('/onboarding/confirm');
  };

  // Group skills by category
  const groupedSkills = availableSkills.reduce((acc, occSkill) => {
    const category = occSkill.skill.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(occSkill);
    return acc;
  }, {} as Record<string, typeof availableSkills>);

  const categoryOrder: Array<'knowledge' | 'skill' | 'ability' | 'tool'> = [
    'skill',
    'knowledge',
    'ability',
    'tool',
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="full" size="md" className="mb-6" />

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Let's see what you're working with
          </h1>
          <p className="text-gray-600">
            Rate how often you use these skills in your current role.
          </p>
        </div>

        {/* Skills List */}
        {isLoading ? (
          <Card className="mb-8">
            <CareerLoader variant="compact" />
            <p className="text-center text-sm text-gray-500 mt-2 pb-4">
              Loading skills for {currentOccupation.title}...
            </p>
          </Card>
        ) : (
          <>
            {categoryOrder.map((category) => {
              const skills = groupedSkills[category];
              if (!skills?.length) return null;

              return (
                <div key={category} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {category === 'tool' ? 'Tools & Technology' : `${category}s`}
                  </h2>
                  {skills.map((occSkill) => {
                    const rating = skillRatings.find(
                      (r) => r.skillId === occSkill.skill.id
                    );
                    return (
                      <SkillRatingCard
                        key={occSkill.skill.id}
                        skillId={occSkill.skill.id}
                        name={occSkill.skill.name}
                        description={occSkill.skill.description}
                        category={occSkill.skill.category}
                        currentRating={rating?.proficiency}
                        onRate={(p) =>
                          handleRate(occSkill.skill.id, occSkill.skill.name, p)
                        }
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Custom skill ratings (if any) */}
            {skillRatings.filter((r) => r.skillId.startsWith('custom-')).length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Custom Skills
                </h2>
                {skillRatings
                  .filter((r) => r.skillId.startsWith('custom-'))
                  .map((rating) => (
                    <Card key={rating.skillId} className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{rating.skillName}</span>
                        <span className="text-sm text-gray-500">
                          {rating.proficiency === 3
                            ? 'Regularly'
                            : rating.proficiency === 2
                            ? 'Sometimes'
                            : 'Rarely'}
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
            )}

            {/* Add Custom Skill */}
            {!showCustomSkill ? (
              <button
                onClick={() => setShowCustomSkill(true)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8"
              >
                <Plus className="w-4 h-4" />
                Add a skill we missed
              </button>
            ) : (
              <Card className="mb-8">
                <h3 className="font-medium mb-2">Add a custom skill</h3>
                <input
                  type="text"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  placeholder="Skill name..."
                  className="w-full px-4 py-2 border rounded-lg mb-3"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCustomSkill}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCustomSkill(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Back Link */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">
              {progress.rated} of {progress.total} skills rated
            </div>
            <div className="w-48 h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-2 bg-primary-500 rounded-full transition-all"
                style={{ width: `${(progress.rated / progress.total) * 100}%` }}
              />
            </div>
          </div>
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
