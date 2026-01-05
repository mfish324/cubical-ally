import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Loader2,
  Clock,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
} from '@/components/ui';
import { documentApi, userApi, analysisApi, evidenceApi } from '@/services/api';
import type { GeneratedDocument, DocumentGenerateRequest } from '@/types';

const generateSchema = z.object({
  audience: z.enum(['manager', 'hr', 'skip_level', 'unknown']),
  tone: z.enum(['formal', 'conversational', 'concise']),
  emphasis: z.string().optional(),
});

type GenerateFormData = z.infer<typeof generateSchema>;

export default function DocumentPage() {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const { data: gapAnalysis } = useQuery({
    queryKey: ['gapAnalysis'],
    queryFn: analysisApi.getAnalysis,
    enabled: !!profile?.target_occupation_code,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => evidenceApi.getAll(),
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: documentApi.getAll,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      audience: 'manager',
      tone: 'conversational',
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data: DocumentGenerateRequest) => documentApi.generate(data),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDoc(doc);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => documentApi.downloadPdf(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promotion-case-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  const onSubmit = (data: GenerateFormData) => {
    generateMutation.mutate(data);
  };

  const copyToClipboard = () => {
    if (selectedDoc) {
      navigator.clipboard.writeText(selectedDoc.content_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const audienceLabels = {
    manager: 'Direct Manager',
    hr: 'HR / People Team',
    skip_level: 'Skip-Level Manager',
    unknown: 'General Audience',
  };

  const toneLabels = {
    formal: 'Formal & Professional',
    conversational: 'Conversational',
    concise: 'Brief & Direct',
  };

  // Check readiness
  const hasEnoughData = evidence && evidence.length >= 1 && gapAnalysis;

  if (!profile?.target_occupation_code) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Set Your Target Role First
              </h2>
              <p className="text-gray-500 mb-4">
                You need to select a target role before generating a promotion case.
              </p>
              <a href="/onboarding/target">
                <Button>Select Target Role</Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Promotion Case Generator</h1>
          <p className="text-gray-500 mt-1">
            Create a compelling case for your promotion to {profile?.target_occupation_title}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Form & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generate Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  Generate New Document
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {/* Readiness check */}
                  {!hasEnoughData && (
                    <div className="p-3 bg-attention-50 border border-attention-200 rounded-lg text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-attention-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-attention-800">Add more evidence</p>
                          <p className="text-attention-700">
                            Document at least one win to generate a stronger case.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audience selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Who will read this?
                    </label>
                    <select
                      {...register('audience')}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none"
                    >
                      <option value="manager">Direct Manager</option>
                      <option value="hr">HR / People Team</option>
                      <option value="skip_level">Skip-Level Manager</option>
                      <option value="unknown">General Audience</option>
                    </select>
                  </div>

                  {/* Tone selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tone
                    </label>
                    <select
                      {...register('tone')}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none"
                    >
                      <option value="conversational">Conversational</option>
                      <option value="formal">Formal & Professional</option>
                      <option value="concise">Brief & Direct</option>
                    </select>
                  </div>

                  {/* Emphasis (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special emphasis (optional)
                    </label>
                    <textarea
                      {...register('emphasis')}
                      placeholder="E.g., highlight leadership growth, technical achievements..."
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:border-primary-500 outline-none resize-none"
                    />
                  </div>

                  {/* Data summary */}
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-2">Your case includes:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>
                        {evidence?.length || 0} documented win{evidence?.length !== 1 ? 's' : ''}
                      </li>
                      <li>{gapAnalysis?.strengths?.length || 0} demonstrated strengths</li>
                      <li>
                        {gapAnalysis?.readiness_score || 0}% readiness for{' '}
                        {profile?.target_occupation_title}
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={generateMutation.isPending}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Generate My Case
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Document History */}
            {documents && documents.length > 0 && (
              <Card>
                <CardHeader>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center justify-between w-full"
                  >
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      Previous Documents ({documents.length})
                    </CardTitle>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        showHistory ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </CardHeader>
                {showHistory && (
                  <CardContent>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedDoc?.id === doc.id
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              v{doc.version}
                            </span>
                            <Badge size="sm" variant="neutral">
                              {toneLabels[doc.tone]}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(doc.generated_at).toLocaleDateString()} -{' '}
                            {audienceLabels[doc.audience as keyof typeof audienceLabels]}
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Right column - Document Preview */}
          <div className="lg:col-span-2">
            {generateMutation.isPending ? (
              <Card className="h-full min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Crafting your promotion case...
                  </p>
                  <p className="text-gray-500">
                    This may take a moment as we analyze your achievements
                  </p>
                </div>
              </Card>
            ) : selectedDoc ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Promotion Case</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Version {selectedDoc.version} - {toneLabels[selectedDoc.tone]} for{' '}
                      {audienceLabels[selectedDoc.audience as keyof typeof audienceLabels]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                      leftIcon={
                        copied ? (
                          <Check className="w-4 h-4 text-secondary-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadMutation.mutate(selectedDoc.id)}
                      isLoading={downloadMutation.isPending}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap font-mono text-sm"
                      style={{ minHeight: '400px' }}
                    >
                      {selectedDoc.content_markdown}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-gray-400">
                    Generated {new Date(selectedDoc.generated_at).toLocaleString()}
                  </p>
                </CardFooter>
              </Card>
            ) : (
              <Card className="h-full min-h-[500px] flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Build Your Case
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Configure your document settings on the left and click "Generate My Case" to
                    create a personalized promotion document.
                  </p>
                  <div className="text-sm text-gray-400">
                    <p>Your case will include:</p>
                    <ul className="mt-2 space-y-1">
                      <li>Your documented wins and achievements</li>
                      <li>Skills aligned to your target role</li>
                      <li>Personalized narrative for your audience</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">Tips for Using Your Promotion Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-1">Review & Personalize</p>
                <p>Add specific details, names, and metrics that only you know.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Practice Your Delivery</p>
                <p>Use this as talking points for your promotion conversation.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Keep Adding Wins</p>
                <p>The more evidence you add, the stronger your next case will be.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
