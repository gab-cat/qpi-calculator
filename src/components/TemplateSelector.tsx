import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookTemplate, GraduationCap, Search, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useQueryWithStatus } from '@/lib/utils';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useGradeStore } from '@/stores/grade-store';
import { useQuery } from 'convex/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface Template {
  id: string;
  name: string;
  description: string;
  courseCount: number;
  semesterCount: number;
  isCustom: boolean;
  popularity?: number;
  lastUsed?: string;
}

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: Template) => void;
}

// Use Convex query for templates with enhanced status
const useTemplatesQuery = (search?: string) => {
  return useQueryWithStatus(api.templates.list, {
    search: search || undefined,
    limit: 20
  });
};

// Hook to fetch full template details when needed
const useTemplateDetails = (templateId: string | null) => {
  return useQuery(
    api.templates.getById,
    templateId ? { id: templateId as Id<"templates"> } : "skip"
  );
};

export function TemplateSelector({
  open,
  onOpenChange,
  onTemplateSelect
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [parent] = useAutoAnimate();

  // Access grade store to check for existing data
  const { grades, semesters, loadTemplateCourses } = useGradeStore();
  const hasExistingData = grades.length > 0 || semesters.length > 0;

  // Query templates from Convex with enhanced status
  const templatesQuery = useTemplatesQuery(searchQuery);
  const { data: templatesData, isPending: isLoading, error } = templatesQuery;
  const templates = templatesData?.templates || [];

  // Fetch full template details when a template is selected
  const fullTemplateData = useTemplateDetails(selectedTemplate);

  const handleTemplateSelect = () => {
    const template = templates.find(t => t._id === selectedTemplate);
    if (template) {
      // Check if there's existing data that will be overwritten
      if (hasExistingData) {
        setShowOverwriteWarning(true);
      } else {
        applyTemplate();
      }
    }
  };

  const applyTemplate = async () => {
    try {
      if (!fullTemplateData) {
        throw new Error('Template details not loaded yet');
      }

      // Convert Convex template format to component expected format
      const formattedTemplate: Template = {
        id: fullTemplateData._id,
        name: fullTemplateData.name,
        description: fullTemplateData.description || '',
        courseCount: fullTemplateData.semesters.reduce((sum: number, semester: { courses: unknown[] }) => sum + semester.courses.length, 0),
        semesterCount: fullTemplateData.semesters.length,
        isCustom: true,
        popularity: undefined,
        lastUsed: undefined,
      };

      // Use the full template data from Convex instead of mock data
      await loadTemplateCourses(fullTemplateData);

      onTemplateSelect(formattedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
      setSearchQuery('');
      setShowOverwriteWarning(false);
    } catch (error) {
      console.error('Failed to apply template:', error);
      // You might want to show an error message here
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-5xl max-h-[80vh] w-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookTemplate className="h-5 w-5" />
              Select Course Template
            </DialogTitle>
            <DialogDescription>
              Choose from popular course templates or create your own custom template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="template-search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="template-search"
                  placeholder="Search by program name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>


            {/* Template Grid */}
            {error ? (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load templates. Please try again.
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
              </div>
            ) : (
              <div ref={parent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {templates.map((template) => (
                  <Card
                    key={template._id}
                    className={`cursor-pointer transition-all pt-6 duration-200 hover:border-primary/20 ${
                      selectedTemplate === template._id
                        ? 'ring-1 ring-primary border-primary bg-primary/5'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedTemplate(template._id)}
                  >
                    <CardHeader className="py-0">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base leading-tight truncate flex-1">
                          {template.name}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {template.totalCourses} courses
                          </span>
                          <span className="flex items-center gap-1">
                            <BookTemplate className="h-3 w-3" />
                            {template.semesterCount} semesters
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!error && !isLoading && templates.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <BookTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found matching "{searchQuery}"</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            )}

            {!error && !isLoading && templates.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <BookTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates created yet</p>
                <p className="text-sm">Create your first template to get started</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTemplateSelect}
                disabled={!selectedTemplate}
              >
                Use Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overwrite Warning Dialog */}
      <Dialog open={showOverwriteWarning} onOpenChange={setShowOverwriteWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Template Application
            </DialogTitle>
            <DialogDescription>
              Applying this template will replace your current academic data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This action will overwrite your existing grades, semesters, and academic records.
                This cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              <p>You currently have:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{grades.length} grade record{grades.length !== 1 ? 's' : ''}</li>
                <li>{semesters.length} semester{semesters.length !== 1 ? 's' : ''}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOverwriteWarning(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                applyTemplate();
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
