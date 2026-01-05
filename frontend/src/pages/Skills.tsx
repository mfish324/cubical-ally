import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Target,
  Sparkles,
  Loader2,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  PriorityBadge,
  CategoryBadge,
  ProgressRing,
} from '@/components/ui';
import { analysisApi, userApi } from '@/services/api';

type TabType = 'gaps' | 'strengths' | 'all';

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('gaps');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const { data: gapAnalysis, isLoading } = useQuery({
    queryKey: ['gapAnalysis'],
    queryFn: analysisApi.getAnalysis,
    enabled: !!profile?.target_occupation_code,
  });

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'gaps', label: 'Focus Areas', count: gapAnalysis?.gaps?.length || 0 },
    { id: 'strengths', label: 'Strengths', count: gapAnalysis?.strengths?.length || 0 },
    { id: 'all', label: 'All Skills' },
  ];

  if (!profile?.target_occupation_code) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Target Role Selected
              </h2>
              <p className="text-gray-500 mb-4">
                Choose a target role to see your skill gaps and get personalized coaching.
              </p>
              <Link to="/onboarding/target">
                <Button>Select Target Role</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Skills</h1>
          <p className="text-gray-500 mt-1">
            Track your progress toward {profile?.target_occupation_title}
          </p>
        </div>

        {/* Readiness Summary */}
        {gapAnalysis && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-8">
              <ProgressRing progress={gapAnalysis.readiness_score} size="md" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Your Readiness Score</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Based on {gapAnalysis.matched_skills} of {gapAnalysis.total_target_skills} skills
                  required for {profile?.target_occupation_title}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-secondary-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {gapAnalysis.strengths.length} strengths
                  </span>
                  <span className="flex items-center gap-1 text-attention-600">
                    <AlertCircle className="w-4 h-4" />
                    {gapAnalysis.gaps.length} gaps
                  </span>
                </div>
              </div>
              <Button variant="secondary" onClick={() => analysisApi.refreshAnalysis()}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Gaps Tab */}
            {activeTab === 'gaps' && (
              <div className="space-y-4">
                {gapAnalysis?.gaps && gapAnalysis.gaps.length > 0 ? (
                  gapAnalysis.gaps.map((gap) => (
                    <Link key={gap.skill.id} to={`/skills/${gap.skill.id}`}>
                      <Card variant="interactive" className="mb-4">
                        <CardContent>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CategoryBadge category={gap.skill.category} />
                                <PriorityBadge priority={gap.priority} />
                              </div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {gap.skill.name}
                              </h3>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {gap.skill.description}
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                <span>
                                  Your level: {gap.user_proficiency || 0} / Required:{' '}
                                  {Math.round(gap.required_level)}
                                </span>
                                <span>Importance: {gap.importance.toFixed(1)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-primary-600">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm">Get coaching</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">No skill gaps!</h3>
                      <p className="text-gray-500">
                        You have all the skills needed for {profile?.target_occupation_title}.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Strengths Tab */}
            {activeTab === 'strengths' && (
              <div className="space-y-4">
                {gapAnalysis?.strengths && gapAnalysis.strengths.length > 0 ? (
                  <div className="grid gap-4">
                    {gapAnalysis.strengths.map((skill) => (
                      <Card key={skill.id}>
                        <CardContent>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-secondary-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900">{skill.name}</h3>
                                <CategoryBadge category={skill.category} />
                              </div>
                              <p className="text-sm text-gray-500">{skill.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Building your strengths
                      </h3>
                      <p className="text-gray-500">
                        Rate your skills higher as you develop them to see them here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* All Skills Tab */}
            {activeTab === 'all' && (
              <div className="space-y-6">
                {/* Strengths section */}
                {gapAnalysis?.strengths && gapAnalysis.strengths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-secondary-600" />
                      Strengths ({gapAnalysis.strengths.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis.strengths.map((skill) => (
                        <Badge key={skill.id} variant="success">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partial matches section */}
                {gapAnalysis?.partial_matches && gapAnalysis.partial_matches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                      In Progress ({gapAnalysis.partial_matches.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis.partial_matches.map((skill) => (
                        <Badge key={skill.id} variant="primary">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps section */}
                {gapAnalysis?.gaps && gapAnalysis.gaps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-attention-600" />
                      Needs Development ({gapAnalysis.gaps.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis.gaps.map((gap) => (
                        <Link key={gap.skill.id} to={`/skills/${gap.skill.id}`}>
                          <Badge variant="warning" className="cursor-pointer hover:opacity-80">
                            {gap.skill.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Help section */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              How Skill Ratings Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">1 - Rarely</p>
                <p className="text-gray-500">Limited exposure or just getting started</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">2 - Sometimes</p>
                <p className="text-gray-500">Use occasionally in your current role</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">3 - Regularly</p>
                <p className="text-gray-500">Apply frequently and confidently</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
