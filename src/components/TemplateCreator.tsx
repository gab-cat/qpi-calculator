import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookTemplate, Save, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  yearLevel: number;
  semester: 'first' | 'second' | 'summer';
}

interface TemplateCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveTemplate: (template: { name: string; description: string; courses: Course[] }) => void;
}

export function TemplateCreator({ open, onOpenChange, onSaveTemplate }: TemplateCreatorProps) {
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
  });

  const [courses, setCourses] = useState<Course[]>([]);

  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    units: 3,
    yearLevel: 1,
    semester: 'first' as 'first' | 'second' | 'summer',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [parent] = useAutoAnimate();

  // Convex mutation for creating templates
  const createTemplateMutation = useMutation(api.templates.create);

  const validateTemplateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!templateForm.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (courses.length === 0) {
      newErrors.courses = 'At least one course is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCourseForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newCourse.code.trim()) {
      newErrors.courseCode = 'Course code is required';
    }

    if (!newCourse.title.trim()) {
      newErrors.courseTitle = 'Course title is required';
    }

    if (newCourse.units < 1 || newCourse.units > 6) {
      newErrors.units = 'Units must be between 1 and 6';
    }

    return newErrors;
  };

  const addCourse = () => {
    const courseErrors = validateCourseForm();
    if (Object.keys(courseErrors).length > 0) {
      setErrors(courseErrors);
      return;
    }

    const course: Course = {
      id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newCourse,
    };

    setCourses(prev => [...prev, course]);

    // Reset form
    setNewCourse({
      code: '',
      title: '',
      units: 3,
      yearLevel: 1,
      semester: 'first',
    });

    setErrors({});
  };

  const removeCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  const handleSave = async () => {
    if (!validateTemplateForm()) return;

    setIsSaving(true);
    setErrors({});

    try {
      // Convert courses to Convex format
      const convexSemesters = courses.reduce((acc, course) => {
        const semesterKey = `${course.yearLevel}-${course.semester}`;
        if (!acc[semesterKey]) {
          acc[semesterKey] = {
            yearLevel: course.yearLevel,
            semesterType: course.semester,
            courses: []
          };
        }
        // For now, we'll use a placeholder ID since courses might not exist in Convex yet
        // In a real implementation, you'd need to either create courses first or use existing ones
        acc[semesterKey].courses.push(course.id as any);
        return acc;
      }, {} as Record<string, any>);

      const convexTemplateData = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || undefined,
        semesters: Object.values(convexSemesters)
      };

      // Save template to Convex backend
      await createTemplateMutation(convexTemplateData);

      // Also call the original callback for local handling
      onSaveTemplate({
        name: templateForm.name,
        description: templateForm.description,
        courses,
      });

      // Reset form
      setTemplateForm({
        name: '',
        description: '',
      });
      setCourses([]);
      setNewCourse({
        code: '',
        title: '',
        units: 3,
        yearLevel: 1,
        semester: 'first',
      });
      setErrors({});

      onOpenChange(false);
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
    setCourses([]);
    setNewCourse({
      code: '',
      title: '',
      units: 3,
      yearLevel: 1,
      semester: 'first',
    });
    setErrors({});
    onOpenChange(false);
  };

  const coursesByYear = courses.reduce((acc, course) => {
    if (!acc[course.yearLevel]) {
      acc[course.yearLevel] = { first: [], second: [], summer: [] };
    }
    acc[course.yearLevel][course.semester].push(course);
    return acc;
  }, {} as Record<number, Record<string, Course[]>>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookTemplate className="h-5 w-5" />
            Create Course Template
          </DialogTitle>
          <DialogDescription>
            Create a custom course template with your preferred courses and structure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Computer Science BS Program"
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
                placeholder="Describe your course template..."
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

          {/* Add Course Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-code">Course Code</Label>
                  <Input
                    id="course-code"
                    placeholder="e.g., CS101"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse(prev => ({
                      ...prev,
                      code: e.target.value.toUpperCase()
                    }))}
                    className={errors.courseCode ? 'border-destructive' : ''}
                  />
                  {errors.courseCode && (
                    <p className="text-sm text-destructive">{errors.courseCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    placeholder="e.g., Introduction to Programming"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    className={errors.courseTitle ? 'border-destructive' : ''}
                  />
                  {errors.courseTitle && (
                    <p className="text-sm text-destructive">{errors.courseTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Input
                    id="units"
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.units}
                    onChange={(e) => setNewCourse(prev => ({
                      ...prev,
                      units: parseInt(e.target.value) || 3
                    }))}
                    className={errors.units ? 'border-destructive' : ''}
                  />
                  {errors.units && (
                    <p className="text-sm text-destructive">{errors.units}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year-level">Year Level</Label>
                  <Input
                    id="year-level"
                    type="number"
                    min="1"
                    max="5"
                    value={newCourse.yearLevel}
                    onChange={(e) => setNewCourse(prev => ({
                      ...prev,
                      yearLevel: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <select
                    id="semester"
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse(prev => ({
                      ...prev,
                      semester: e.target.value as 'first' | 'second' | 'summer'
                    }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="first">1st Semester</option>
                    <option value="second">2nd Semester</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
              </div>

              <Button onClick={addCourse} className="w-full" disabled={isSaving}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </CardContent>
          </Card>

          {/* Courses Preview */}
          {courses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Courses ({courses.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div ref={parent}>
                  {Object.entries(coursesByYear).map(([yearLevel, semesters]) => (
                  <div key={yearLevel} className="space-y-2">
                    <h4 className="font-medium">Year {yearLevel}</h4>
                    {Object.entries(semesters).map(([semester, semesterCourses]) => (
                      semesterCourses.length > 0 && (
                        <div key={semester} className="ml-4 space-y-1">
                          <h5 className="text-sm font-medium text-muted-foreground capitalize">
                            {semester} Semester
                          </h5>
                          {semesterCourses.map((course) => (
                            <div key={course.id} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{course.code}</span>
                                <span className="text-sm text-muted-foreground">{course.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {course.units} units
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCourse(course.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          )}

          {errors.courses && (
            <p className="text-sm text-destructive">{errors.courses}</p>
          )}

          {errors.general && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors.general}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={courses.length === 0 || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
