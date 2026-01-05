import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ProgressRing,
  Badge,
  PriorityBadge,
} from '@/components/ui';
import { userApi, analysisApi, evidenceApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const { data: gapAnalysis, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['gapAnalysis'],
    queryFn: analysisApi.getAnalysis,
    enabled: !!profile?.target_occupation_code,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => evidenceApi.getAll(),
  });

  const recentEvidence = evidence?.slice(0, 3) || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''} 👋
          </h1>
        </div>

        {/* Check-in Alert (if due) */}
        {profile?.checkin_enabled && (
          <Card className="mb-6 bg-primary-50 border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your ally is checking in</p>
                  <p className="text-sm text-gray-600">Time to capture this week's progress</p>
                </div>
              </div>
              <Button size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Start check-in
              </Button>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Readiness Score */}
          <Card>
            <CardHeader>
              <CardTitle>Your Readiness</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoadingAnalysis ? (
                <div className="animate-pulse">
                  <div className="w-24 h-24 bg-gray-200 rounded-full" />
                </div>
              ) : gapAnalysis ? (
                <>
                  <ProgressRing
                    progress={gapAnalysis.readiness_score}
                    size="lg"
                    label={`for ${profile?.target_occupation_title}`}
                  />
                  <Link
                    to="/analysis"
                    className="text-sm text-primary-600 hover:text-primary-700 mt-4 flex items-center gap-1"
                  >
                    View full analysis <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="mb-2">No target role set</p>
                  <Link to="/onboarding/target" className="text-primary-600 hover:underline">
                    Choose a target
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wins Documented */}
          <Card>
            <CardHeader>
              <CardTitle>Wins Documented</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="text-5xl font-bold text-gray-900">{evidence?.length || 0}</p>
              <p className="text-gray-500 mt-1">Accomplishments captured</p>
              <Link to="/evidence">
                <Button size="sm" variant="secondary" className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
                  Add a win
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="text-5xl font-bold text-gray-900">
                {gapAnalysis?.gaps?.length || 0}
              </p>
              <p className="text-gray-500 mt-1">Skills to develop</p>
              <Link
                to="/skills"
                className="text-sm text-primary-600 hover:text-primary-700 mt-4 flex items-center gap-1"
              >
                View coaching <ChevronRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Strengths Section */}
        {gapAnalysis && gapAnalysis.strengths.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary-600" />
                Your Strengths
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Skills you've got for {profile?.target_occupation_title}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.strengths.map((skill) => (
                  <Badge key={skill.id} variant="success">
                    ✓ {skill.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Focus Areas */}
        {gapAnalysis && gapAnalysis.gaps.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                Priority Focus Areas
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Your ally recommends focusing here
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gapAnalysis.gaps.slice(0, 3).map((gap) => (
                  <div
                    key={gap.skill.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-attention-500" />
                      <div>
                        <p className="font-medium text-gray-900">{gap.skill.name}</p>
                        <p className="text-sm text-gray-500">{gap.skill.description.slice(0, 60)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={gap.priority} />
                      <Link
                        to={`/skills/${gap.skill.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {gapAnalysis.gaps.length > 3 && (
                <Link
                  to="/skills"
                  className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-flex items-center gap-1"
                >
                  View all {gapAnalysis.gaps.length} focus areas <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Wins */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Wins</CardTitle>
            <Link to="/evidence">
              <Button size="sm" variant="ghost">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentEvidence.length > 0 ? (
              <div className="space-y-3">
                {recentEvidence.map((ev) => (
                  <div key={ev.id} className="p-4 bg-gray-50 rounded-lg">
                    {ev.skill_detail && (
                      <Badge variant="primary" size="sm" className="mb-2">
                        {ev.skill_detail.name}
                      </Badge>
                    )}
                    <p className="text-gray-900">{ev.action}</p>
                    {ev.result && (
                      <p className="text-sm text-gray-600 mt-1">Result: {ev.result}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(ev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No wins documented yet</p>
                <Link to="/evidence">
                  <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Add your first win
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/document">
            <Card variant="interactive" className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Generate promotion document</p>
                  <p className="text-sm text-gray-500">Create your case with AI</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/skills">
            <Card variant="interactive" className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-secondary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Update my skills</p>
                  <p className="text-sm text-gray-500">Refresh your skill ratings</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
