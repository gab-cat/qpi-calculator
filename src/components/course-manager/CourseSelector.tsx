import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, BookOpen, Filter, Check, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Course } from '@/lib/types/academic-types';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface CourseSelectorProps {
  selectedCourses: string[];
  onCourseSelect: (courseIds: string[]) => void;
  onCourseCreate: (course: CreateCourseRequest) => Promise<Course>;
  maxSelections?: number;
  showUnitsTotal?: boolean;
  filterByLevel?: number;
}

interface CreateCourseRequest {
  courseCode: string;
  title: string;
  units: number;
}

export function CourseSelector({
  selectedCourses,
  onCourseSelect,
  onCourseCreate,
  maxSelections,
  showUnitsTotal = true,
}: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState<CreateCourseRequest>({
    courseCode: '',
    title: '',
    units: 3,
  });
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [parent] = useAutoAnimate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch courses based on search query
  const searchResults = useQuery(
    api.courses.search,
    debouncedSearchQuery ? {
      query: debouncedSearchQuery,
      limit: 20,
    } : "skip"
  );

  // Fetch all courses when no search
  const allCoursesData = useQuery(
    api.courses.list,
    !debouncedSearchQuery ? {
      limit: 20,
    } : "skip"
  );

  // Update courses list based on search results
  useEffect(() => {
    if (debouncedSearchQuery && searchResults) {
      setAllCourses(searchResults.courses);
      setHasMore(searchResults.hasMore);
      setNextCursor(searchResults.nextCursor);
    } else if (!debouncedSearchQuery && allCoursesData) {
      setAllCourses(allCoursesData.courses);
      setHasMore(allCoursesData.hasMore);
      setNextCursor(allCoursesData.nextCursor);
    }
  }, [searchResults, allCoursesData, debouncedSearchQuery]);

  // Load more courses
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      // This would need to be implemented as a separate query or mutation
      // For now, we'll just show loading state
      console.log('Loading more courses with cursor:', nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore]);

  // Calculate totals
  const selectedCoursesData = useMemo(() => {
    return allCourses.filter(course => selectedCourses.includes(course._id));
  }, [allCourses, selectedCourses]);

  const totalUnits = useMemo(() => {
    return selectedCoursesData.reduce((sum, course) => sum + course.units, 0);
  }, [selectedCoursesData]);

  const handleCourseToggle = (courseId: string) => {
    const isSelected = selectedCourses.includes(courseId);
    
    if (isSelected) {
      // Remove course
      onCourseSelect(selectedCourses.filter(id => id !== courseId));
    } else {
      // Add course (check max selections)
      if (maxSelections && selectedCourses.length >= maxSelections) {
        return; // Don't add if at max
      }
      onCourseSelect([...selectedCourses, courseId]);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.courseCode || !newCourse.title || !newCourse.units) {
      return;
    }

    try {
      const created = await onCourseCreate(newCourse);
      // Auto-select the newly created course
      onCourseSelect([...selectedCourses, created._id]);
      
      // Reset form and close dialog
      setNewCourse({ courseCode: '', title: '', units: 3 });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Handle error (would typically show toast/notification)
      console.error('Failed to create course:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with search and stats */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showUnitsTotal && (
            <div className="flex items-center gap-1 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{totalUnits}</span>
              <span className="text-muted-foreground">units selected</span>
            </div>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Course Code</label>
                  <Input
                    placeholder="e.g., CS-101"
                    value={newCourse.courseCode}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Course Title</label>
                  <Input
                    placeholder="e.g., Introduction to Computer Science"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Units</label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.units}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, units: parseInt(e.target.value) || 3 }))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCourse}>
                    Create Course
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selection summary */}
      {selectedCourses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selected Courses ({selectedCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={parent} className="flex flex-wrap gap-2">
              {selectedCoursesData.map((course) => (
                <Badge
                  key={course._id}
                  variant="default"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleCourseToggle(course._id)}
                >
                  {course.courseCode}
                  <span className="ml-1 text-xs opacity-75">({course.units}u)</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Available Courses</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {allCourses.length} courses
              {hasMore && <span className="text-xs">(more available)</span>}
              {maxSelections && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{selectedCourses.length}/{maxSelections} selected</span>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {searchResults === undefined || allCoursesData === undefined ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading courses...</p>
            </div>
          ) : allCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No courses found</p>
              <p className="text-sm">Try adjusting your search or create a new course</p>
            </div>
          ) : (
            <div ref={parent}>
              {allCourses.map((course) => {
              const isSelected = selectedCourses.includes(course._id);
              const isMaxReached = maxSelections && selectedCourses.length >= maxSelections;
              const canSelect = !isMaxReached || isSelected;

              return (
                <div
                  key={course._id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 border-primary hover:bg-primary/15' 
                      : canSelect
                      ? 'hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleCourseToggle(course._id)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{course.courseCode}</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        {course.units} {course.units === 1 ? 'unit' : 'units'}
                      </Badge>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {course.title}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  'Load More Courses'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}