import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  Briefcase,
  BookOpen,
  Eye,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  CategoryBadge,
  PriorityBadge,
} from '@/components/ui';
import { analysisApi, evidenceApi } from '@/services/api';

export default function SkillCoachingPage() {
  const { skillId } = useParams<{ skillId: string }>();

  const { data: gapAnalysis } = useQuery({
    queryKey: ['gapAnalysis'],
    queryFn: analysisApi.getAnalysis,
  });

  const { data: coaching, isLoading: isLoadingCoaching, error: coachingError } = useQuery({
    queryKey: ['coaching', skillId],
    queryFn: () => analysisApi.getCoaching(skillId!),
    enabled: !!skillId,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence', skillId],
    queryFn: () => evidenceApi.getAll(skillId),
    enabled: !!skillId,
  });

  // Find the skill details from gap analysis
  const skillGap = gapAnalysis?.gaps?.find((g) => g.skill.id === skillId);
  const skill = skillGap?.skill;

  if (!skillId) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Skill Not Found</h2>
              <Link to="/skills">
                <Button>Back to Skills</Button>
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
        {/* Back link */}
        <Link
          to="/skills"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Skills
        </Link>

        {/* Skill Header */}
        {skill ? (
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryBadge category={skill.category} />
                    {skillGap && <PriorityBadge priority={skillGap.priority} />}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{skill.name}</h1>
                  <p className="text-gray-600">{skill.description}</p>
                  {skillGap && (
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        Your level:{' '}
                        <span className="font-medium text-gray-900">
                          {skillGap.user_proficiency || 0}
                        </span>
                      </span>
                      <span className="text-gray-500">
                        Required:{' '}
                        <span className="font-medium text-gray-900">
                          {Math.round(skillGap.required_level)}
                        </span>
                      </span>
                      <span className="text-gray-500">
                        Importance:{' '}
                        <span className="font-medium text-gray-900">
                          {skillGap.importance.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 animate-pulse">
            <CardContent>
              <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded" />
            </CardContent>
          </Card>
        )}

        {/* AI Coaching */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            AI Career Coaching
          </h2>

          {isLoadingCoaching ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-gray-500">Generating personalized coaching...</p>
                </div>
              </CardContent>
            </Card>
          ) : coachingError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">Failed to load coaching. Please try again.</p>
              </CardContent>
            </Card>
          ) : coaching ? (
            <div className="grid gap-4">
              {/* Why it matters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-attention-500" />
                    Why This Matters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{coaching.why_it_matters}</p>
                </CardContent>
              </Card>

              {/* Develop at work */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary-600" />
                    Develop at Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {coaching.develop_at_work.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Develop independently */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-600" />
                    Learn Independently
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {coaching.develop_independently.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* How to demonstrate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary-600" />
                    How to Demonstrate This Skill
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {coaching.how_to_demonstrate.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Related Evidence */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-attention-500" />
              Your Evidence for This Skill
            </h2>
            <Link to="/evidence">
              <Button size="sm" variant="secondary">
                Add Evidence
              </Button>
            </Link>
          </div>

          {evidence && evidence.length > 0 ? (
            <div className="space-y-3">
              {evidence.map((ev) => (
                <Card key={ev.id}>
                  <CardContent>
                    <p className="text-gray-900 font-medium">{ev.action}</p>
                    {ev.result && (
                      <p className="text-sm text-gray-500 mt-1">Result: {ev.result}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(ev.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50">
              <CardContent className="text-center py-8">
                <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No evidence documented for this skill yet.</p>
                <Link to="/evidence">
                  <Button size="sm">Add Your First Win</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick actions */}
        <Card className="bg-primary-50 border-primary-200">
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-3">Ready to Level Up?</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/evidence">
                <Button size="sm">Document a Win</Button>
              </Link>
              <Link to="/document">
                <Button size="sm" variant="secondary">
                  Generate Promotion Case
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
