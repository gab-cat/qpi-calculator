import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, Calendar, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import type { Template } from '@/lib/types/academic-types';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  templates: Template[];
  onTemplateSelect: (templateId: string) => void;
  onTemplateApply: (templateId: string, options: TemplateApplicationOptions) => void;
  onTemplatePreview: (templateId: string) => void;
  showPreview?: boolean;
}

interface TemplateApplicationOptions {
  startYear: number;
  includesSummer: boolean;
  academicYearStart: string;
  mergeMode: 'replace' | 'append';
}

export function TemplateSelector({
  selectedTemplateId,
  templates,
  onTemplateSelect,
  onTemplateApply,
  onTemplatePreview,
  showPreview = true,
}: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [applicationOptions, setApplicationOptions] = useState<TemplateApplicationOptions>({
    startYear: 1,
    includesSummer: false,
    academicYearStart: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    mergeMode: 'replace',
  });

  const selectedTemplate = templates.find(t => t._id === selectedTemplateId);

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    onTemplatePreview(template._id);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;
    
    onTemplateApply(selectedTemplateId, applicationOptions);
    setIsApplyDialogOpen(false);
  };

  const getTemplateStats = (template: Template) => {
    const totalCourses = template.semesters.reduce((sum, sem) => sum + sem.courses.length, 0);
    const totalUnits = template.semesters.reduce((sum, sem) => 
      sum + sem.courses.reduce((semSum, course) => semSum + course.units, 0), 0
    );
    const years = Math.max(...template.semesters.map(s => s.yearLevel));
    const hasSummer = template.semesters.some(s => s.semesterType === 'summer');

    return { totalCourses, totalUnits, years, hasSummer };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Course Templates</h3>
          <p className="text-sm text-muted-foreground">
            Choose a template to quickly set up your academic program
          </p>
        </div>
        
        {selectedTemplate && (
          <Button onClick={() => setIsApplyDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Apply Template
          </Button>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => {
          const stats = getTemplateStats(template);
          const isSelected = selectedTemplateId === template._id;

          return (
            <Card
              key={template._id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 min-h-[160px] ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => onTemplateSelect(template._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base break-words leading-tight">
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Template Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{stats.totalCourses}</span>
                    <span className="text-muted-foreground">courses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{stats.totalUnits}</span>
                    <span className="text-muted-foreground">units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{stats.years}</span>
                    <span className="text-muted-foreground">years</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {stats.hasSummer && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        Summer
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {showPreview && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No Templates Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There are no course templates available at the moment.
            </p>
            <Button variant="outline">
              Browse Course Library
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            {previewTemplate?.description && (
              <p className="text-sm text-muted-foreground">
                {previewTemplate.description}
              </p>
            )}
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4 overflow-y-auto">
              {previewTemplate.semesters.map((semester) => (
                <Card key={`${semester.yearLevel}-${semester.semesterType}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Year {semester.yearLevel} - {semester.semesterType === 'first' ? '1st Semester' : 
                        semester.semesterType === 'second' ? '2nd Semester' : 'Summer'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {semester.courses.map((course) => (
                        <div key={course._id} className="flex items-center justify-between p-2 rounded border">
                          <div>
                            <span className="font-medium text-sm">{course.courseCode}</span>
                            <div className="text-xs text-muted-foreground">{course.title}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {course.units} units
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Template Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Template Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="startYear">Starting Year Level</Label>
              <Select
                value={applicationOptions.startYear.toString()}
                onValueChange={(value) => setApplicationOptions(prev => ({ 
                  ...prev, 
                  startYear: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                  <SelectItem value="6">6th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year Start</Label>
              <Input
                id="academicYear"
                placeholder="e.g., 2024-2025"
                value={applicationOptions.academicYearStart}
                onChange={(e) => setApplicationOptions(prev => ({ 
                  ...prev, 
                  academicYearStart: e.target.value 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="includesSummer">Summer Classes</Label>
              <Select
                value={applicationOptions.includesSummer.toString()}
                onValueChange={(value) => setApplicationOptions(prev => ({ 
                  ...prev, 
                  includesSummer: value === 'true' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No Summer Classes</SelectItem>
                  <SelectItem value="true">Include Summer Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mergeMode">Application Mode</Label>
              <Select
                value={applicationOptions.mergeMode}
                onValueChange={(value: 'replace' | 'append') => setApplicationOptions(prev => ({ 
                  ...prev, 
                  mergeMode: value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">Replace Current Data</SelectItem>
                  <SelectItem value="append">Add to Current Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplyTemplate}>
                Apply Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}