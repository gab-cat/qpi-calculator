import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Plus, Check, AlertTriangle, Loader2, ArrowLeft, X } from 'lucide-react';
import { useQueryWithStatus } from '@/lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToAddCoursesStore } from '@/stores/to-add-courses-store';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface Course {
  _id: string;
  courseCode: string;
  title: string;
  units: number;
  createdAt: number;
  updatedAt: number;
}

interface CourseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCoursesSelected: (courses: Course[]) => void;
  semesterId: string;
  multiSelect?: boolean;
}

export function CourseSelector({
  open,
  onOpenChange,
  onCoursesSelected,
  semesterId: _semesterId, // Reserved for future filtering functionality
  multiSelect = true
}: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('select');
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    title: '',
    units: 3,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [parent] = useAutoAnimate();

  // Note: _semesterId is reserved for future filtering functionality
  void _semesterId;

  // Use the to-add-courses store
  const {
    coursesToAdd,
    addCourse,
    removeCourse,
    toggleCourse,
    clearAllCourses,
    isCourseSelected,
    getTotalUnits,
    getCourseCount
  } = useToAddCoursesStore();

  // Convex mutation for creating courses
  const createCourseMutation = useMutation(api.courses.create);

  // Query courses from Convex with search using enhanced status
  const coursesQuery = useQueryWithStatus(
    api.courses.list,
    searchQuery ? { search: searchQuery, limit: 50 } : { limit: 50 }
  );

  const { data: coursesData, isPending: isLoading, error } = coursesQuery;

  // Reset form state when dialog opens/closes (but keep courses to add)
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setActiveTab('select');
      setCourseForm({
        courseCode: '',
        title: '',
        units: 3,
      });
      setFormErrors({});
      setIsCreating(false);
    }
  }, [open]);

  // Filter courses based on search query (client-side fallback)
  const filteredCourses = useMemo(() => {
    const courseList = coursesData?.courses || [];
    if (!searchQuery) return courseList;
    return courseList.filter(course =>
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coursesData?.courses, searchQuery]);

  const handleCourseToggle = (course: Course) => {
    if (multiSelect) {
      toggleCourse(course);
    } else {
      // Single select mode - clear all and select only this one
      clearAllCourses();
      addCourse(course);
    }
  };

  const handleSelectCourses = () => {
    onCoursesSelected(coursesToAdd);
    clearAllCourses(); // Clear the selection after adding
    onOpenChange(false);
  };

  const validateCourseForm = () => {
    const errors: Record<string, string> = {};

    if (!courseForm.courseCode.trim()) {
      errors.courseCode = 'Course code is required';
    }

    if (!courseForm.title.trim()) {
      errors.title = 'Course title is required';
    }

    if (courseForm.units < 1 || courseForm.units > 6) {
      errors.units = 'Units must be between 1 and 6';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCourse = async () => {
    if (!validateCourseForm()) return;

    setIsCreating(true);
    setFormErrors({});

    try {
      const createdCourse = await createCourseMutation({
        courseCode: courseForm.courseCode.toUpperCase(),
        title: courseForm.title.trim(),
        units: courseForm.units,
      });

      if (!createdCourse) {
        throw new Error('Failed to create course in database');
      }

      // Auto-select the newly created course
      addCourse(createdCourse);

      // Switch back to select tab to show the new course
      setActiveTab('select');

      // Reset form
      setCourseForm({
        courseCode: '',
        title: '',
        units: 3,
      });

      // Refresh the course list by clearing search (this will trigger a re-query)
      setSearchQuery('');

    } catch (error) {
      console.error('Failed to create course:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific error types from Convex
      if (errorMessage.includes('DUPLICATE_COURSE_CODE')) {
        setFormErrors({ courseCode: 'A course with this code already exists' });
      } else if (errorMessage.includes('INVALID_COURSE_CODE')) {
        setFormErrors({ courseCode: 'Course code must be 3-20 characters' });
      } else if (errorMessage.includes('INVALID_TITLE')) {
        setFormErrors({ title: 'Course title must be 1-200 characters' });
      } else if (errorMessage.includes('INVALID_UNITS')) {
        setFormErrors({ units: 'Units must be between 1 and 6' });
      } else {
        setFormErrors({ general: 'Failed to create course. Please try again.' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNewCourse = () => {
    setActiveTab('create');
  };

  const selectedCount = getCourseCount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Select Courses
          </DialogTitle>
          <DialogDescription>
            {multiSelect
              ? "Choose courses to add to this semester"
              : "Select a course to add to this semester"
            }
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

          <TabsContent value="select" className="space-y-4 mt-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="course-search">Search Courses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="course-search"
                  placeholder="Search by course code or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Selected courses summary */}
            {selectedCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedCount} course{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {getTotalUnits()} total units
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllCourses}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSelectCourses}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Add Selected
                    </Button>
                  </div>
                </div>

                {/* Selected courses list */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Courses:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {coursesToAdd.map((course) => (
                      <div
                        key={course._id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{course.courseCode}</span>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {course.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {course.units} unit{course.units !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCourse(course._id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Course list */}
            <ScrollArea className="h-64 border rounded-md">
              {error ? (
                <Alert className="m-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load courses. Please try again.
                  </AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <div className="text-sm text-muted-foreground">Loading courses...</div>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? `No courses found matching "${searchQuery}"` : 'No courses available'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNewCourse}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Course
                  </Button>
                </div>
              ) : (
                <div ref={parent} className="p-2 space-y-1">
                  {filteredCourses.map((course) => {
                    const isSelected = isCourseSelected(course._id);
                    return (
                      <div
                        key={course._id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                          isSelected ? 'bg-primary/5 border-primary' : ''
                        }`}
                        onClick={() => handleCourseToggle(course)}
                      >
                        {multiSelect && (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div click
                            className="pointer-events-none"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{course.courseCode}</span>
                            <Badge variant="outline" className="text-xs">
                              {course.units} unit{course.units !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {course.title}
                          </p>
                        </div>
                        {!multiSelect && isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Course creation form */}
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
                  className={formErrors.courseCode ? 'border-destructive' : ''}
                  disabled={isCreating}
                />
                {formErrors.courseCode && (
                  <p className="text-sm text-destructive">{formErrors.courseCode}</p>
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
                  className={formErrors.title ? 'border-destructive' : ''}
                  disabled={isCreating}
                />
                {formErrors.title && (
                  <p className="text-sm text-destructive">{formErrors.title}</p>
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
                  <SelectTrigger className={formErrors.units ? 'border-destructive' : ''}>
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
                {formErrors.units && (
                  <p className="text-sm text-destructive">{formErrors.units}</p>
                )}
              </div>

              {formErrors.general && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{formErrors.general}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('select')}
                  disabled={isCreating}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Select
                </Button>
                <Button onClick={handleCreateCourse} disabled={isCreating}>
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
