import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Loader2,
  Trophy,
  Calendar,
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
  CategoryBadge,
} from '@/components/ui';
import { evidenceApi, skillsApi } from '@/services/api';
import type { Evidence, EvidenceCreate, UserSkill } from '@/types';

const evidenceSchema = z.object({
  skill: z.string().optional(),
  situation: z.string().optional(),
  action: z.string().min(10, 'Describe what you did (at least 10 characters)'),
  result: z.string().optional(),
  date: z.string().optional(),
});

type EvidenceFormData = z.infer<typeof evidenceSchema>;

export default function EvidencePage() {
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enhancingId, setEnhancingId] = useState<string | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<{
    enhanced: string;
    placeholders: string[];
    tip?: string;
  } | null>(null);

  const { data: evidence, isLoading } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => evidenceApi.getAll(),
  });

  const { data: userSkills } = useQuery({
    queryKey: ['userSkills'],
    queryFn: skillsApi.getUserSkills,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: EvidenceCreate) => evidenceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      setIsAddingNew(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EvidenceCreate> }) =>
      evidenceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      setEditingId(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });

  const enhanceMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.enhance(id),
    onSuccess: (data) => {
      setEnhancedResult(data);
    },
    onSettled: () => {
      setEnhancingId(null);
    },
  });

  const onSubmit = (data: EvidenceFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (ev: Evidence) => {
    setEditingId(ev.id);
    reset({
      skill: ev.skill || undefined,
      situation: ev.situation,
      action: ev.action,
      result: ev.result,
      date: ev.date || undefined,
    });
  };

  const handleEnhance = (id: string) => {
    setEnhancingId(id);
    setEnhancedResult(null);
    enhanceMutation.mutate(id);
  };

  const applyEnhancement = (ev: Evidence) => {
    if (enhancedResult) {
      updateMutation.mutate({
        id: ev.id,
        data: { action: enhancedResult.enhanced },
      });
      setEnhancedResult(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evidence & Wins</h1>
            <p className="text-gray-500 mt-1">
              Document your accomplishments in STAR format to build your promotion case
            </p>
          </div>
          {!isAddingNew && (
            <Button
              onClick={() => {
                setIsAddingNew(true);
                setEditingId(null);
                reset();
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add a Win
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAddingNew || editingId) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary-600" />
                {editingId ? 'Edit Win' : 'Add a New Win'}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Use the STAR method: Situation, Action, Result
              </p>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {/* Skill selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Skill (optional)
                  </label>
                  <select
                    {...register('skill')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none"
                  >
                    <option value="">Select a skill...</option>
                    {userSkills?.map((us: UserSkill) => (
                      <option key={us.id} value={us.skill || us.id}>
                        {us.skill_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Situation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Situation (optional)
                  </label>
                  <textarea
                    {...register('situation')}
                    placeholder="What was the context or challenge?"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none resize-none"
                  />
                </div>

                {/* Action (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('action')}
                    placeholder="What did you do? Be specific about your contributions."
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 outline-none resize-none ${
                      errors.action ? 'border-red-500' : 'border-gray-300 focus:border-primary-500'
                    }`}
                  />
                  {errors.action && (
                    <p className="mt-1 text-sm text-red-600">{errors.action.message}</p>
                  )}
                </div>

                {/* Result */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result (optional)
                  </label>
                  <textarea
                    {...register('result')}
                    placeholder="What was the outcome? Include metrics if possible."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none resize-none"
                  />
                </div>

                {/* Date */}
                <Input
                  type="date"
                  label="When did this happen? (optional)"
                  {...register('date')}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Save Changes' : 'Add Win'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Enhancement Result Modal */}
        {enhancedResult && (
          <Card className="mb-6 border-primary-300 bg-primary-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-700">
                <Sparkles className="w-5 h-5" />
                AI-Enhanced Version
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-primary-200">
                <p className="text-gray-900">{enhancedResult.enhanced}</p>
              </div>
              {enhancedResult.placeholders && enhancedResult.placeholders.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Fill in these placeholders:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {enhancedResult.placeholders.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {enhancedResult.tip && (
                <p className="text-sm text-primary-600 italic">{enhancedResult.tip}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                onClick={() => {
                  const currentEvidence = evidence?.find((e) => e.id === enhancingId);
                  if (currentEvidence) applyEnhancement(currentEvidence);
                }}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Apply Enhancement
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEnhancedResult(null)}>
                Dismiss
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Evidence List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : evidence && evidence.length > 0 ? (
          <div className="space-y-4">
            {evidence.map((ev) => (
              <Card key={ev.id} className="hover:border-gray-300 transition-colors">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Skill badge and date */}
                      <div className="flex items-center gap-2 mb-3">
                        {ev.skill_detail && (
                          <CategoryBadge category={ev.skill_detail.category} />
                        )}
                        {ev.skill_detail && (
                          <Badge variant="primary" size="sm">
                            {ev.skill_detail.name}
                          </Badge>
                        )}
                        {ev.date && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ev.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* STAR content */}
                      {ev.situation && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Situation
                          </span>
                          <p className="text-gray-700">{ev.situation}</p>
                        </div>
                      )}
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Action
                        </span>
                        <p className="text-gray-900 font-medium">{ev.action}</p>
                      </div>
                      {ev.result && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Result
                          </span>
                          <p className="text-gray-700">{ev.result}</p>
                        </div>
                      )}

                      {/* AI enhanced indicator */}
                      {ev.ai_enhanced_version && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-primary-600">
                          <Sparkles className="w-3 h-3" />
                          AI-enhanced
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEnhance(ev.id)}
                        disabled={enhancingId === ev.id}
                        title="Enhance with AI"
                      >
                        {enhancingId === ev.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(ev)}
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Delete this win?')) {
                            deleteMutation.mutate(ev.id);
                          }
                        }}
                        title="Delete"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No wins documented yet</h3>
              <p className="text-gray-500 mb-4">
                Start capturing your accomplishments to build a compelling promotion case.
              </p>
              <Button
                onClick={() => setIsAddingNew(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Your First Win
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips section */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">Tips for Writing Strong Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-0.5 flex-shrink-0" />
                <span>Use strong action verbs: "Led", "Implemented", "Reduced", "Increased"</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-0.5 flex-shrink-0" />
                <span>Include specific metrics whenever possible (%, $, time saved)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-0.5 flex-shrink-0" />
                <span>Focus on your unique contribution, not the team's</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-600 mt-0.5 flex-shrink-0" />
                <span>
                  Use the AI enhance feature to strengthen weak statements
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
