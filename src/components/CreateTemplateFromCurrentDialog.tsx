import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookTemplate, Save, Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { SemesterRecord, GradeRecord } from '@/lib/types/academic-types';

interface CreateTemplateFromCurrentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesters: SemesterRecord[];
  grades: GradeRecord[];
  onSuccess?: () => void;
}

export function CreateTemplateFromCurrentDialog({
  open,
  onOpenChange,
  semesters,
  grades,
  onSuccess
}: CreateTemplateFromCurrentDialogProps) {
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Convex mutation for creating templates
  const createTemplateMutation = useMutation(api.templates.create);

  const validateTemplateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!templateForm.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (grades.length === 0) {
      newErrors.general = 'No courses available to create template';
    }

    if (semesters.length === 0) {
      newErrors.general = 'No semesters available to create template';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTemplateForm()) return;

    setIsSaving(true);
    setErrors({});

    try {
      // Convert all semesters and their grades to Convex format
      const convexSemesters = semesters.map(semester => {
        const semesterGrades = grades.filter(grade => grade.semesterId === semester.id);
        return {
          yearLevel: semester.yearLevel,
          semesterType: semester.semesterType,
          courses: semesterGrades.map(grade => grade.courseId as any) // Cast to Convex Id type
        };
      }).filter(semester => semester.courses.length > 0); // Only include semesters with courses

      const convexTemplateData = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || undefined,
        semesters: convexSemesters
      };

      // Save template to Convex backend
      await createTemplateMutation(convexTemplateData);

      // Reset form
      setTemplateForm({
        name: '',
        description: '',
      });
      setErrors({});

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save template:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific error types from Convex
      if (errorMessage.includes('DUPLICATE_TEMPLATE_NAME')) {
        setErrors({ name: 'A template with this name already exists' });
      } else if (errorMessage.includes('INVALID_TEMPLATE_NAME')) {
        setErrors({ name: 'Template name must be 1-100 characters' });
      } else if (errorMessage.includes('EMPTY_TEMPLATE')) {
        setErrors({ general: 'Template must have at least one course' });
      } else {
        setErrors({ general: 'Failed to save template. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTemplateForm({
      name: '',
      description: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  const totalUnits = grades.reduce((sum, grade) => sum + grade.units, 0);
  const totalSemesters = semesters.length;
  const semestersWithCourses = semesters.filter(semester =>
    grades.filter(grade => grade.semesterId === semester.id).length > 0
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookTemplate className="h-5 w-5" />
            Create Template from All Semesters
          </DialogTitle>
          <DialogDescription>
            Create a template based on all courses across all your semesters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Computer Science Program 2024-2025"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                className={errors.name ? 'border-destructive' : ''}
                disabled={isSaving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Describe this template..."
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* All Semesters Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Academic Record Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{grades.length} courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookTemplate className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{totalUnits} total units</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{semestersWithCourses} of {totalSemesters} semesters</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>Source:</strong> All semesters from your current academic record
              </div>
            </CardContent>
          </Card>

          {/* Courses Preview by Semester */}
          {grades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Courses by Semester ({grades.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {semesters.map((semester) => {
                  const semesterGrades = grades.filter(grade => grade.semesterId === semester.id);
                  if (semesterGrades.length === 0) return null;

                  return (
                    <div key={semester.id} className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <h4 className="font-medium text-sm">
                          {semester.semesterType === 'first' ? '1st Semester' :
                           semester.semesterType === 'second' ? '2nd Semester' : 'Summer'} {semester.academicYear}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          Year {semester.yearLevel}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {semesterGrades.length} courses
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2 ml-4">
                        {semesterGrades.map((grade) => (
                          <div key={grade.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{grade.courseCode}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {grade.courseTitle}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {grade.units} {grade.units === 1 ? 'unit' : 'units'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {errors.general && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors.general}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={grades.length === 0 || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Template...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
