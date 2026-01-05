import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Card, ProgressRing, Badge, PriorityBadge } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function GapResults() {
  const navigate = useNavigate();
  const {
    currentOccupation,
    targetOccupation,
    availableSkills,
    skillRatings,
  } = useOnboardingStore();

  // Compute gap analysis locally (before account creation)
  const analysis = useMemo(() => {
    if (!targetOccupation || !availableSkills.length) {
      return null;
    }

    // Create a map of user's skill ratings
    const userSkillMap = new Map(
      skillRatings.map((r) => [r.skillId, r.proficiency])
    );

    const strengths: typeof availableSkills = [];
    const gaps: Array<{ skill: typeof availableSkills[0]; priority: 'high' | 'medium' | 'low' }> = [];
    const partials: typeof availableSkills = [];

    let totalImportance = 0;
    let matchedImportance = 0;

    availableSkills.forEach((occSkill) => {
      const importance = occSkill.importance;
      totalImportance += importance;

      const userProficiency = userSkillMap.get(occSkill.skill.id);
      const requiredLevel = occSkill.level;

      // Map proficiency to comparable level (1→2, 2→4, 3→6)
      const userLevel = userProficiency ? userProficiency * 2 : 0;

      if (userProficiency && userLevel >= requiredLevel * 0.7) {
        strengths.push(occSkill);
        matchedImportance += importance;
      } else if (userProficiency) {
        partials.push(occSkill);
        matchedImportance += importance * 0.5;
      } else {
        const priority = importance >= 4 ? 'high' : importance >= 3 ? 'medium' : 'low';
        gaps.push({ skill: occSkill, priority });
      }
    });

    const readinessScore = totalImportance > 0
      ? Math.round((matchedImportance / totalImportance) * 100)
      : 0;

    // Sort gaps by importance
    gaps.sort((a, b) => b.skill.importance - a.skill.importance);

    return {
      readinessScore,
      strengths,
      gaps,
      partials,
      totalSkills: availableSkills.length,
      matchedSkills: strengths.length,
    };
  }, [targetOccupation, availableSkills, skillRatings]);

  if (!currentOccupation || !targetOccupation) {
    navigate('/');
    return null;
  }

  const handleContinue = () => {
    navigate('/signup');
  };

  const handleBack = () => {
    navigate('/onboarding/target');
  };

  const handleExploreOther = () => {
    navigate('/onboarding/target');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="full" size="md" className="mb-6" />

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-primary-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Here's your path to {targetOccupation.title}
          </h1>
        </div>

        {/* Readiness Score */}
        {analysis && (
          <>
            <Card className="text-center mb-8">
              <ProgressRing
                progress={analysis.readinessScore}
                size="xl"
                className="mb-4"
              />
              <p className="text-lg font-medium text-gray-900">
                You're {analysis.readinessScore}% ready for {targetOccupation.title}
              </p>
              <p className="text-gray-500">
                You have {analysis.matchedSkills} of {analysis.totalSkills} key skills for this role
              </p>
            </Card>

            {/* Tabs / Sections */}
            <div className="space-y-6">
              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-secondary-600" />
                    <h2 className="font-semibold text-gray-900">Strengths</h2>
                    <span className="text-sm text-gray-500">
                      Skills you have that matter
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.strengths.map((occSkill) => (
                      <Badge key={occSkill.skill.id} variant="success">
                        ✓ {occSkill.skill.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Focus Areas (Gaps) */}
              {analysis.gaps.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-attention-600" />
                    <h2 className="font-semibold text-gray-900">Focus Areas</h2>
                    <span className="text-sm text-gray-500">
                      Skills to develop
                    </span>
                  </div>
                  <div className="space-y-3">
                    {analysis.gaps.map(({ skill: occSkill, priority }) => (
                      <div
                        key={occSkill.skill.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {occSkill.skill.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {occSkill.skill.description.slice(0, 80)}...
                          </p>
                        </div>
                        <PriorityBadge priority={priority} />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Partial Matches */}
              {analysis.partials.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <h2 className="font-semibold text-gray-900">Building</h2>
                    <span className="text-sm text-gray-500">
                      Skills you're developing
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.partials.map((occSkill) => (
                      <Badge key={occSkill.skill.id} variant="primary">
                        ~ {occSkill.skill.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* CTA Section */}
            <Card className="mt-8 text-center bg-primary-50 border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to build your case?
              </h3>
              <p className="text-gray-600 mb-4">
                Create an account to save your progress and start documenting your wins
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleContinue}
                  size="lg"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Create my promotion plan
                </Button>
                <Button
                  onClick={handleExploreOther}
                  variant="secondary"
                  size="lg"
                >
                  Explore a different target
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Back Link */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mt-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to target selection
        </button>
      </div>
    </div>
  );
}
