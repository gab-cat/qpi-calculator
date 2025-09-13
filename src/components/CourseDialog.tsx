import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, Search, Loader2 } from 'lucide-react';
import { CourseSelector } from './CourseSelector';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCourse: (courseInfo: { courseId: string; courseCode: string; title: string; units: number }) => void;
  onAddCourses?: (courses: Array<{ courseId: string; courseCode: string; title: string; units: number }>) => void;
  semesterId: string;
}

export function CourseDialog({
  open,
  onOpenChange,
  onAddCourse,
  onAddCourses,
  semesterId
}: CourseDialogProps) {
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    title: '',
    units: 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('select');
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Convex mutation for creating courses
  const createCourseMutation = useMutation(api.courses.create);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!courseForm.courseCode.trim()) {
      newErrors.courseCode = 'Course code is required';
    }

    if (!courseForm.title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (courseForm.units < 1 || courseForm.units > 6) {
      newErrors.units = 'Units must be between 1 and 6';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    setErrors({});

    try {
      // Create course in Convex backend first
      const createdCourse = await createCourseMutation({
        courseCode: courseForm.courseCode.toUpperCase(),
        title: courseForm.title.trim(),
        units: courseForm.units,
      });

      if (!createdCourse) {
        throw new Error('Failed to create course in database');
      }

      // Use the Convex-generated ID for consistency
      const courseInfo = {
        courseId: createdCourse._id,
        courseCode: createdCourse.courseCode,
        title: createdCourse.title,
        units: createdCourse.units,
      };

      // Add course locally to the calculator
      onAddCourse(courseInfo);

      // Reset form
      setCourseForm({
        courseCode: '',
        title: '',
        units: 3,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create course:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific error types from Convex
      if (errorMessage.includes('DUPLICATE_COURSE_CODE')) {
        setErrors({ courseCode: 'A course with this code already exists' });
      } else if (errorMessage.includes('INVALID_COURSE_CODE')) {
        setErrors({ courseCode: 'Course code must be 3-20 characters' });
      } else if (errorMessage.includes('INVALID_TITLE')) {
        setErrors({ title: 'Course title must be 1-200 characters' });
      } else if (errorMessage.includes('INVALID_UNITS')) {
        setErrors({ units: 'Units must be between 1 and 6' });
      } else {
        setErrors({ general: 'Failed to create course. Please try again.' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setCourseForm({
      courseCode: '',
      title: '',
      units: 3,
    });
    setErrors({});
    setActiveTab('select');
    onOpenChange(false);
  };

  const handleCoursesSelected = (courses: Array<{ _id: string; courseCode: string; title: string; units: number }>) => {
    if (onAddCourses) {
      const formattedCourses = courses.map(course => ({
        courseId: course._id,
        courseCode: course.courseCode,
        title: course.title,
        units: course.units,
      }));
      onAddCourses(formattedCourses);
    } else if (courses.length > 0) {
      // Fallback to single course addition
      const course = courses[0];
      onAddCourse({
        courseId: course._id,
        courseCode: course.courseCode,
        title: course.title,
        units: course.units,
      });
    }
    onOpenChange(false);
  };

  const handleOpenCourseSelector = () => {
    setShowCourseSelector(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Add Courses
            </DialogTitle>
            <DialogDescription>
              Select existing courses or create a new one
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Select Courses
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-4">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Browse Existing Courses</h3>
                <p className="text-muted-foreground mb-4">
                  Search and select from courses in the database
                </p>
                <Button onClick={handleOpenCourseSelector}>
                  <Search className="h-4 w-4 mr-2" />
                  Open Course Selector
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-code">Course Code</Label>
                  <Input
                    id="course-code"
                    placeholder="e.g., CS101"
                    value={courseForm.courseCode}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      courseCode: e.target.value.toUpperCase()
                    }))}
                    className={errors.courseCode ? 'border-destructive' : ''}
                    disabled={isCreating}
                  />
                  {errors.courseCode && (
                    <p className="text-sm text-destructive">{errors.courseCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    placeholder="e.g., Introduction to Computer Science"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    className={errors.title ? 'border-destructive' : ''}
                    disabled={isCreating}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Select
                    value={courseForm.units.toString()}
                    onValueChange={(value) => setCourseForm(prev => ({
                      ...prev,
                      units: parseInt(value)
                    }))}
                    disabled={isCreating}
                  >
                    <SelectTrigger className={errors.units ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 unit</SelectItem>
                      <SelectItem value="2">2 units</SelectItem>
                      <SelectItem value="3">3 units</SelectItem>
                      <SelectItem value="4">4 units</SelectItem>
                      <SelectItem value="5">5 units</SelectItem>
                      <SelectItem value="6">6 units</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.units && (
                    <p className="text-sm text-destructive">{errors.units}</p>
                  )}
                </div>

                {errors.general && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{errors.general}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {activeTab === 'create' && (
              <Button onClick={handleSubmit} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CourseSelector
        open={showCourseSelector}
        onOpenChange={setShowCourseSelector}
        onCoursesSelected={handleCoursesSelected}
        semesterId={semesterId}
        multiSelect={true}
      />
    </>
  );
}
