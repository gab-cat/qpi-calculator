import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, BookTemplate, Plus, Download, Upload, Sparkles } from 'lucide-react';

// Components
import { TemplateSelector } from '@/components/template-manager/TemplateSelector';
import { CourseSelector } from '@/components/course-manager/CourseSelector';

// Types and stores
import type { Template, Course } from '@/lib/types/academic-types';
import { useCourseStore } from '@/stores/course-store';
import { useUIStore } from '@/stores/ui-store';

interface TemplateApplicationOptions {
  startYear: number;
  includesSummer: boolean;
  academicYearStart: string;
  mergeMode: 'replace' | 'append';
}

export function TemplatesPage() {
  const { 
    availableCourses: courses,
    isLoading: loading,
    setAvailableCourses,
    addCreatedCourse,
  } = useCourseStore();
  
  const { 
    showSuccess,
    showError,
  } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  // Mock templates data for now
  const templates: Template[] = [
    {
      _id: '1',
      name: 'Computer Science BS - Standard Track',
      description: 'Complete 4-year Computer Science curriculum',
      semesters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      _id: '2', 
      name: 'Information Technology BS',
      description: 'IT program with specialization tracks',
      semesters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];

  // Fetch data on mount
  useEffect(() => {
    // Mock course data for now
    const mockCourses: Course[] = [
      {
        _id: '1',
        courseCode: 'CS-101',
        title: 'Introduction to Computer Science',
        units: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        _id: '2',
        courseCode: 'MATH-101', 
        title: 'College Algebra',
        units: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];
    setAvailableCourses(mockCourses);
  }, [setAvailableCourses]);

  // Filter templates by search
  const filteredTemplates = templates.filter((template: Template) => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleTemplatePreview = (templateId: string) => {
    console.log('Preview template:', templateId);
    // Template preview would be handled by the TemplateSelector component
  };

  const handleTemplateApply = async (templateId: string, options: TemplateApplicationOptions) => {
    try {
      console.log('Apply template:', templateId, options);
      // This would integrate with the grade store to create semesters and grades
      showSuccess('Template applied successfully');
    } catch {
      showError('Failed to apply template');
    }
  };

  const handleCourseCreate = async (courseData: { courseCode: string; title: string; units: number }) => {
    try {
      // Mock course creation - in real app this would call Convex
      const newCourse: Course = {
        _id: Date.now().toString(),
        courseCode: courseData.courseCode,
        title: courseData.title,
        units: courseData.units,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      addCreatedCourse(newCourse);
      showSuccess('Course created successfully');
      return newCourse;
    } catch {
      showError('Failed to create course');
      throw new Error('Failed to create course');
    }
  };

  return (
    <div className="container mx-auto space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookTemplate className="h-8 w-8 text-primary" />
            Templates & Courses
          </h1>
          <p className="text-muted-foreground">
            Manage course templates and course library for quick setup
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Template
          </Button>
          
          <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Template creation wizard would go here - allowing users to select courses
                    and organize them by semester and year level.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateTemplateOpen(false)}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Course Templates</TabsTrigger>
          <TabsTrigger value="courses">Course Library</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-4/5"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <TemplateSelector
              selectedTemplateId={selectedTemplate}
              templates={filteredTemplates}
              onTemplateSelect={handleTemplateSelect}
              onTemplateApply={handleTemplateApply}
              onTemplatePreview={handleTemplatePreview}
              showPreview={true}
            />
          )}

          {!loading && filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookTemplate className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">
                  {searchQuery ? 'No Templates Found' : 'No Templates Available'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms or browse all templates.'
                    : 'Create your first template or import one from the course library.'
                  }
                </p>
                <div className="flex justify-center gap-2">
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                  <Button onClick={() => setIsCreateTemplateOpen(true)}>
                    Create Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Selection */}
            <div className="lg:col-span-2">
              <CourseSelector
                selectedCourses={selectedCourses}
                onCourseSelect={setSelectedCourses}
                onCourseCreate={handleCourseCreate}
                showUnitsTotal={true}
              />
            </div>

            {/* Course Management Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsCreateTemplateOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template from Selection
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={selectedCourses.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected Courses
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Course List
                  </Button>
                </CardContent>
              </Card>

              {/* Course Statistics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Course Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Courses</span>
                      <span className="font-medium">{courses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selected</span>
                      <span className="font-medium">{selectedCourses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Units Selected</span>
                      <span className="font-medium">
                        {courses
                          .filter((c: Course) => selectedCourses.includes(c._id))
                          .reduce((sum: number, c: Course) => sum + c.units, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Templates Available</span>
                      <span className="font-medium">{templates.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-muted-foreground">CS-101 added</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">Template created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-muted-foreground">MATH-101 updated</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}