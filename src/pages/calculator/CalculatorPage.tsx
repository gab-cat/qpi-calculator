import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Calculator, Upload, GraduationCap, BookTemplate, Eye, Moon, Sun, Settings, RotateCcw, Download, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Components
import { GradeTable } from '@/components/grade-table/GradeTable';
import { QPISummary } from '@/components/calculator/QPISummary';
import { CSVImporter } from '@/components/csv-handler/CSVImporter';
import { StartupDialog } from '@/components/StartupDialog';
import { TemplateSelector } from '@/components/TemplateSelector';
import { CourseSelector } from '@/components/CourseSelector';
import { TemplateCreator } from '@/components/TemplateCreator';
import { CreateTemplateFromCurrentDialog } from '@/components/CreateTemplateFromCurrentDialog';
import { CalculatorFooter } from '@/components/calculator/CalculatorFooter';

// Types and stores
import type { AcademicRecord, SemesterRecord, GradeRecord } from '@/lib/types/academic-types';
import { useGradeStore } from '@/stores/grade-store';
import { useUIStore } from '@/stores/ui-store';
import { cn, useQueryWithStatus } from '@/lib/utils';
import { CSVExporter } from '@/components/csv-handler/CSVExporter';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface CalculatorPageProps {
  initialData?: {
    academicRecord: AcademicRecord;
    semesters: SemesterRecord[];
    grades: GradeRecord[];
  };
}

export function CalculatorPage({ initialData }: CalculatorPageProps) {
  const {
    academicRecord,
    semesters,
    grades,
    updateGrade,
    addGrade,
    addGrades,
    addSemester,
    updateSemester,
    initializeAcademicRecord,
    resetAll,
    loadTemplateCourses,
    removeGrade,
    removeSemester,
    reorderGrades,
    reorderSemesters,
  } = useGradeStore();
  
  const {
    showSuccess,
    showError,
    theme,
    toggleTheme,
  } = useUIStore();

  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddSemesterDialogOpen, setIsAddSemesterDialogOpen] = useState(false);
  const [isStartupDialogOpen, setIsStartupDialogOpen] = useState(false);
  const [hasDismissedStartupDialog, setHasDismissedStartupDialog] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isCourseSelectorOpen, setIsCourseSelectorOpen] = useState(false);
  const [isTemplateCreatorOpen, setIsTemplateCreatorOpen] = useState(false);
  const [isCreateTemplateFromCurrentOpen, setIsCreateTemplateFromCurrentOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  const [isResetDataDialogOpen, setIsResetDataDialogOpen] = useState(false);
  const [semesterToEdit, setSemesterToEdit] = useState<SemesterRecord | null>(null);
  const [isEditSemesterDialogOpen, setIsEditSemesterDialogOpen] = useState(false);
  const [isTemplateWarningDialogOpen, setIsTemplateWarningDialogOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{ id: string; name: string; description: string; courseCount: number; semesterCount: number; isCustom: boolean; popularity?: number; lastUsed?: string } | null>(null);
  const [semesterToDelete, setSemesterToDelete] = useState<string | null>(null);
  const [isDeleteSemesterDialogOpen, setIsDeleteSemesterDialogOpen] = useState(false);

  // Semester form state
  const [semesterForm, setSemesterForm] = useState({
    academicYear: new Date().getFullYear().toString(),
    semesterType: 'first' as 'first' | 'second' | 'summer',
    yearLevel: 1,
  });

  const [parent] = useAutoAnimate({
    duration: 300,
    easing: 'ease-in-out',
    disrespectUserMotionPreference: false,
  });


  // Initialize with provided data
  useEffect(() => {
    if (initialData) {
      // This would load the initial data into the store
      console.log('Loading initial data:', initialData);
    }
  }, [initialData]);

  // Load startup dialog dismissal state from localStorage
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('qpi-startup-dialog-dismissed');
      if (dismissed === 'true') {
        setHasDismissedStartupDialog(true);
      }
    } catch (error) {
      console.warn('Failed to load startup dialog dismissal state:', error);
    }
  }, []);

  // Show startup dialog if no academic data exists and hasn't been dismissed
  useEffect(() => {
    // Only show startup dialog if we have loaded data and there's no existing data and it hasn't been dismissed
    const hasExistingData = semesters.length > 0 || grades.length > 0 || academicRecord !== null;
    const shouldShowDialog = !hasExistingData && !hasDismissedStartupDialog && !isStartupDialogOpen;

    // Add a small delay to ensure data has been loaded from localStorage
    if (shouldShowDialog) {
      const timer = setTimeout(() => {
        setIsStartupDialogOpen(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [semesters.length, grades.length, academicRecord, hasDismissedStartupDialog]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle startup dialog dismissal
  const handleStartupDialogDismiss = (open: boolean) => {
    setIsStartupDialogOpen(open);
    if (!open && !hasDismissedStartupDialog) {
      // Dialog is being closed for the first time, mark as dismissed
      setHasDismissedStartupDialog(true);
      try {
        localStorage.setItem('qpi-startup-dialog-dismissed', 'true');
      } catch (error) {
        console.warn('Failed to save startup dialog dismissal state:', error);
      }
    }
  };

  // Auto-select the current semester
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      // Select the most recent incomplete semester, or the last one
      const currentSemester = semesters.find(s => !s.isCompleted) || semesters[semesters.length - 1];
      setSelectedSemester(currentSemester.id);
    }
  }, [semesters, selectedSemester]);

  const handleGradeUpdate = async (gradeId: string, updates: Partial<GradeRecord>) => {
    try {
      updateGrade(gradeId, updates);
      showSuccess('Grade updated successfully');
    } catch {
      showError('Failed to update grade');
    }
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGradeToDelete(gradeId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!gradeToDelete) return;

    try {
      removeGrade(gradeToDelete);
      showSuccess('Course deleted successfully');
    } catch {
      showError('Failed to delete course');
    } finally {
      setGradeToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setGradeToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteSemester = (semesterId: string) => {
    setSemesterToDelete(semesterId);
    setIsDeleteSemesterDialogOpen(true);
  };

  const handleConfirmDeleteSemester = async () => {
    if (!semesterToDelete) return;

    try {
      removeSemester(semesterToDelete);

      // If the deleted semester was selected, clear the selection
      if (selectedSemester === semesterToDelete) {
        setSelectedSemester(null);
      }

      showSuccess('Semester deleted successfully');
    } catch {
      showError('Failed to delete semester');
    } finally {
      setSemesterToDelete(null);
      setIsDeleteSemesterDialogOpen(false);
    }
  };

  const handleCancelDeleteSemester = () => {
    setSemesterToDelete(null);
    setIsDeleteSemesterDialogOpen(false);
  };

  const handleAddCourse = async (courseInfo: { courseId: string; courseCode: string; title: string; units: number }) => {
    if (!selectedSemester) return;

    try {
      const newGrade: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId: courseInfo.courseId,
        courseCode: courseInfo.courseCode,
        courseTitle: courseInfo.title,
        units: courseInfo.units,
        semesterId: selectedSemester,
      };

      addGrade(newGrade);
      showSuccess('Course added successfully');
    } catch {
      showError('Failed to add course');
    }
  };

  const handleCoursesSelected = async (courses: Array<{ _id: string; courseCode: string; title: string; units: number; createdAt: number; updatedAt: number }>) => {
    if (!selectedSemester) return;

    try {
      const newGrades = courses.map(course => ({
        courseId: course._id,
        courseCode: course.courseCode,
        courseTitle: course.title,
        units: course.units,
        semesterId: selectedSemester,
      }));

      addGrades(newGrades);
      showSuccess(`${courses.length} course${courses.length !== 1 ? 's' : ''} added successfully`);
    } catch {
      showError('Failed to add courses');
    }
  };

  const handleImportSuccess = (result: {
    importedRecords: number;
    gradeRecords?: Array<{
      courseId: string;
      courseCode: string;
      courseTitle: string;
      units: number;
      numericalGrade?: number;
      semesterId: string;
    }>;
    semesterGroups?: Record<string, Array<{
      row: number;
      courseCode: string;
      courseTitle: string;
      units: number;
      grade?: number;
      semester: string;
      academicYear: string;
      yearLevel?: number;
      isValid: boolean;
      warnings: string[];
    }>>;
  }) => {
    try {
      if (result.gradeRecords && result.semesterGroups) {
        // Create semesters for each unique semester/academic year combination
        const createdSemesterIds: Record<string, string> = {};

        Object.entries(result.semesterGroups).forEach(([key, items]) => {
          if (items.length > 0) {
            const firstItem = items[0];
            // Normalize semester type detection
            let semesterType: 'first' | 'second' | 'summer' = 'first'; // default
            const semesterValue = firstItem.semester.toLowerCase().trim();

            if (semesterValue.includes('second') || semesterValue === '2nd' || semesterValue === '2') {
              semesterType = 'second';
            } else if (semesterValue.includes('summer') || semesterValue === 'sum' || semesterValue === '3') {
              semesterType = 'summer';
            } else if (semesterValue.includes('first') || semesterValue === '1st' || semesterValue === '1') {
              semesterType = 'first';
            }

            // Check if semester already exists
            const existingSemester = semesters.find(s =>
              s.academicYear === firstItem.academicYear &&
              s.semesterType === semesterType
            );

            if (existingSemester) {
              createdSemesterIds[key] = existingSemester.id;
            } else {
              // Create new semester with year level from CSV data
              const yearLevel = firstItem.yearLevel || 1; // Use CSV year level or default to 1
              const semesterId = addSemester({
                academicYear: firstItem.academicYear,
                semesterType,
                yearLevel,
                isCompleted: false,
              });

              createdSemesterIds[key] = semesterId;
            }
          }
        });

        // Update grade records with correct semester IDs
        console.log('About to process grade records. Available semester groups:', Object.keys(result.semesterGroups!));
        console.log('Created semester IDs mapping:', createdSemesterIds);

        const updatedGradeRecords = result.gradeRecords.map((record, index) => {
          console.log(`Processing grade record ${index}:`, record.courseCode, record.courseTitle);

          // Find the semester key for this record
          const semesterKey = Object.keys(result.semesterGroups!).find(key => {
            const items = result.semesterGroups![key];
            const found = items.some(item =>
              item.courseCode === record.courseCode &&
              item.courseTitle === record.courseTitle
            );
            if (found) {
              console.log(`Found matching semester key '${key}' for course ${record.courseCode}`);
            }
            return found;
          });

          const semesterId = semesterKey ? createdSemesterIds[semesterKey] : '';
          console.log('Final semester ID for', record.courseCode, ':', semesterId);

          return {
            ...record,
            semesterId,
          };
        }).filter(record => record.semesterId); // Only include records with valid semester IDs

        console.log('Filtered grade records with valid semester IDs:', updatedGradeRecords.length, 'out of', result.gradeRecords.length);

        console.log('Created semester IDs:', createdSemesterIds);
        console.log('Updated grade records:', updatedGradeRecords);

        // Add grades to the store
        if (updatedGradeRecords.length > 0) {
          addGrades(updatedGradeRecords);
          console.log('Added', updatedGradeRecords.length, 'grades to the store');
        } else {
          console.log('No grade records with valid semester IDs found');
        }
      }

      showSuccess(`Successfully imported ${result.importedRecords} records`);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Failed to process import data:', error);
      showError('Failed to save imported data');
    }
  };

  const handleImportError = (errors: { message?: string }[]) => {
    showError(`Import failed: ${errors[0]?.message || 'Unknown error'}`);
  };



  const handleTemplateSelect = (template: { id: string; name: string; description: string; courseCount: number; semesterCount: number; isCustom: boolean; popularity?: number; lastUsed?: string }) => {
    // Check if there's existing data that would be overwritten
    const hasExistingData = semesters.length > 0 || grades.length > 0;

    if (hasExistingData) {
      setPendingTemplate(template);
      setIsTemplateWarningDialogOpen(true);
    } else {
      // No existing data, load template directly
      loadTemplate(template);
    }
  };

  // Query template data using useQueryWithStatus
  const templateQuery = useQueryWithStatus(
    api.templates.getById,
    pendingTemplate ? { id: pendingTemplate.id as Id<"templates"> } : "skip"
  );

  const loadTemplate = async (template: { id: string; name: string; description: string; courseCount: number; semesterCount: number; isCustom: boolean; popularity?: number; lastUsed?: string }) => {
    try {
      // Initialize academic record if not exists
      if (!academicRecord) {
        await initializeAcademicRecord({
          totalYears: 4,
          includesSummer: true,
        });
      }

      // Query the template data using useQueryWithStatus
      const { data: templateData, isPending, error } = templateQuery;

      if (isPending) {
        // Wait for the query to complete
        return;
      }

      if (error) {
        throw error;
      }

      if (!templateData) {
        throw new Error('Template not found');
      }

      // Load template courses into the store
      await loadTemplateCourses(templateData);

      showSuccess(`Template "${template.name}" loaded successfully with ${template.semesterCount} semesters and ${template.courseCount} courses!`);
      setIsTemplateSelectorOpen(false);
    } catch (error) {
      showError('Failed to load template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleConfirmTemplateLoad = async () => {
    if (!pendingTemplate) return;

    await loadTemplate(pendingTemplate);
    setPendingTemplate(null);
    setIsTemplateWarningDialogOpen(false);
  };

  const handleCancelTemplateLoad = () => {
    setPendingTemplate(null);
    setIsTemplateWarningDialogOpen(false);
  };

  const handleSaveTemplate = async (templateData: { name: string; description: string; courses: Array<{ id: string; code: string; title: string; units: number; yearLevel: number; semester: 'first' | 'second' | 'summer' }> }) => {
    try {
      // TODO: Save template to database/store
      // For now, just show success message
      showSuccess(`Template "${templateData.name}" saved successfully!`);
      console.log('Saved template:', templateData);
    } catch (error) {
      showError('Failed to save template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCreateTemplateFromAllSemesters = () => {
    if (semesters.length === 0) {
      showError('No semesters available to create template');
      return;
    }

    const hasCourses = semesters.some(semester =>
      grades.filter(g => g.semesterId === semester.id).length > 0
    );

    if (!hasCourses) {
      showError('No courses available to create template');
      return;
    }

    setIsCreateTemplateFromCurrentOpen(true);
  };

  const handleCreateTemplateFromCurrentSuccess = () => {
    showSuccess('Template created successfully from all semesters!');
    setIsCreateTemplateFromCurrentOpen(false);
  };

  const handleResetData = async () => {
    try {
      // First reset all data to clear everything
      resetAll();

      // Then initialize with default configuration
      initializeAcademicRecord({
        totalYears: 4,
        includesSummer: true
      });

      // Reset selected semester
      setSelectedSemester(null);

      showSuccess('All data has been reset successfully!');
      setIsResetDataDialogOpen(false);
    } catch (error) {
      showError('Failed to reset data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEditSemester = (semester: SemesterRecord) => {
    setSemesterToEdit(semester);
    setSemesterForm({
      academicYear: semester.academicYear,
      semesterType: semester.semesterType,
      yearLevel: semester.yearLevel,
    });
    setIsEditSemesterDialogOpen(true);
  };

  const handleUpdateSemester = async () => {
    if (!semesterToEdit) return;

    try {
      await updateSemester(semesterToEdit.id, {
        academicYear: semesterForm.academicYear,
        semesterType: semesterForm.semesterType,
        yearLevel: semesterForm.yearLevel,
      });

      showSuccess('Semester updated successfully!');
      setIsEditSemesterDialogOpen(false);
      setSemesterToEdit(null);
    } catch (error) {
      showError('Failed to update semester: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleMoveSemesterUp = (semesterId: string) => {
    const currentOrder = semesters.map(s => s.id);
    const currentIndex = currentOrder.indexOf(semesterId);

    if (currentIndex > 0) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      // Use setTimeout to ensure DOM updates happen in next tick for auto animate
      setTimeout(() => reorderSemesters(newOrder), 0);
    }
  };

  const handleMoveSemesterDown = (semesterId: string) => {
    const currentOrder = semesters.map(s => s.id);
    const currentIndex = currentOrder.indexOf(semesterId);

    if (currentIndex < currentOrder.length - 1) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      // Use setTimeout to ensure DOM updates happen in next tick for auto animate
      setTimeout(() => reorderSemesters(newOrder), 0);
    }
  };

  const handleCreateSemester = async () => {
    try {
      // Initialize academic record if not exists
      if (!academicRecord) {
        await initializeAcademicRecord({
          totalYears: 4,
          includesSummer: true,
        });
      }

      await addSemester({
        academicYear: semesterForm.academicYear,
        semesterType: semesterForm.semesterType,
        yearLevel: semesterForm.yearLevel,
        isCompleted: false,
      });

      showSuccess('Semester created successfully!');
      setIsAddSemesterDialogOpen(false);

      // Reset form
      setSemesterForm({
        academicYear: new Date().getFullYear().toString(),
        semesterType: 'first',
        yearLevel: 1,
      });
    } catch (error) {
      showError('Failed to create semester: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const currentSemester = selectedSemester ? semesters.find(s => s.id === selectedSemester) : null;
  const currentGrades = selectedSemester && currentSemester 
    ? currentSemester.grades
        .map(gradeId => grades.find(g => g.id === gradeId))
        .filter((grade): grade is GradeRecord => grade !== undefined)
    : [];

  return (
    <>
      <StartupDialog
        open={isStartupDialogOpen}
        onOpenChange={handleStartupDialogDismiss}
      />

      <TemplateSelector
        open={isTemplateSelectorOpen}
        onOpenChange={setIsTemplateSelectorOpen}
        onTemplateSelect={handleTemplateSelect}
      />

      <TemplateCreator
        open={isTemplateCreatorOpen}
        onOpenChange={setIsTemplateCreatorOpen}
        onSaveTemplate={handleSaveTemplate}
      />

      <CreateTemplateFromCurrentDialog
        open={isCreateTemplateFromCurrentOpen}
        onOpenChange={setIsCreateTemplateFromCurrentOpen}
        semesters={semesters}
        grades={grades}
        onSuccess={handleCreateTemplateFromCurrentSuccess}
      />

      <CourseSelector
        open={isCourseSelectorOpen}
        onOpenChange={setIsCourseSelectorOpen}
        onCoursesSelected={handleCoursesSelected}
        semesterId={selectedSemester || ''}
        multiSelect={true}
      />

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="truncate">QPI Calculator</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your grades and monitor your academic progress
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2">
          <Dialog open={isOverviewDialogOpen} onOpenChange={setIsOverviewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Eye className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">Overview</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>QPI Overview</DialogTitle>
              </DialogHeader>
              {academicRecord ? (
                <QPISummary
                  academicRecord={academicRecord}
                  showBreakdown={true}
                  comparisonMode="semester"
                  onDrillDown={(year, semester) => {
                    // Switch to calculator and select appropriate semester
                    setIsOverviewDialogOpen(false);
                    const targetSemester = semesters.find(s =>
                      s.academicYear === year &&
                      (semester === 'all' || s.semesterType === semester)
                    );
                    if (targetSemester) {
                      setSelectedSemester(targetSemester.id);
                    }
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold mb-2">No Academic Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add some grades to see your QPI summary and academic progress.
                    </p>
                    <Button onClick={() => setIsOverviewDialogOpen(false)}>
                      Go to Calculator
                    </Button>
                  </CardContent>
                </Card>
              )}
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            onClick={() => setIsTemplateSelectorOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <BookTemplate className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Templates</span>
          </Button>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none">
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">Import CSV</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Grade Data</DialogTitle>
              </DialogHeader>
              <CSVImporter
                onImportStart={() => console.log('Import started')}
                onImportSuccess={handleImportSuccess}
                onImportError={handleImportError}
                onImportCancel={() => setIsImportDialogOpen(false)}
                acceptedFormats={['.csv', '.xlsx']}
                maxFileSize={5 * 1024 * 1024}
                showPreview={true}
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={grades.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Export</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsResetDataDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Calculator Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar - Semester Navigation */}
        <div className="space-y-4 lg:order-1 order-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Semesters</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddSemesterDialogOpen(true)}
                    title="Add Semester"
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {semesters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => handleCreateTemplateFromAllSemesters()}
                      title="Create Template from All Semesters"
                      className="p-0"
                    >
                      <BookTemplate className="h-4 w-4" />
                      <span className="sm:inline">Create as template</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2" >
              <div className="space-y-1" ref={parent}>
              {semesters.map((semester, index) => (
                <div
                  key={semester.id}
                  className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSemester === semester.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedSemester(semester.id)}
                >
                  <div className="flex items-center justify-between">
                    {/* Reorder Controls */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSemesterUp(semester.id);
                        }}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground touch-manipulation"
                        title="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSemesterDown(semester.id);
                        }}
                        disabled={index === semesters.length - 1}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground touch-manipulation"
                        title="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className={cn('font-bold text-sm', selectedSemester === semester.id && 'text-primary')}>
                        {semester.yearLevel === 1 ? '1st Year' :
                         semester.yearLevel === 2 ? '2nd Year' :
                         semester.yearLevel === 3 ? '3rd Year' :
                         semester.yearLevel === 4 ? '4th Year' :
                         semester.yearLevel === 5 ? '5th Year' :
                         `${semester.yearLevel}th Year`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {semester.semesterType === 'first' ? '1st' :
                         semester.semesterType === 'second' ? '2nd' : 'Summer'} Sem
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right space-y-1">
                        {semester.semesterQPI ? (
                          <Badge variant="outline" className="text-xs">
                            {semester.semesterQPI.toFixed(3)} QPI
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No QPI
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSemester(semester);
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit Semester"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSemester(semester.id);
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Semester"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {semesters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No semesters yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setIsAddSemesterDialogOpen(true)}
                  >
                    Add your first semester
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Grade Table */}
        <div className="lg:col-span-3 lg:order-2 order-1">
          {currentSemester ? (
            <GradeTable
              semesterId={currentSemester.id}
              semester={currentSemester}
              grades={currentGrades}
              onGradeUpdate={handleGradeUpdate}
              onGradeDelete={handleDeleteGrade}
              onAddCourse={handleAddCourse}
              onOpenCourseDialog={() => setIsCourseSelectorOpen(true)}
              onReorderGrades={reorderGrades}
              showCalculations={true}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8 sm:py-12 px-4">
                <Calculator className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2 text-lg">No Semester Selected</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Select a semester from the sidebar to start calculating grades.
                </p>
                <Button onClick={() => setIsAddSemesterDialogOpen(true)} className="w-full sm:w-auto">
                  Create First Semester
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Semester Dialog */}
      <Dialog open={isAddSemesterDialogOpen} onOpenChange={setIsAddSemesterDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Semester</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Input
                id="academic-year"
                type="number"
                placeholder="2025"
                value={semesterForm.academicYear}
                onChange={(e) => setSemesterForm(prev => ({
                  ...prev,
                  academicYear: e.target.value
                }))}
                min="2000"
                max="2030"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester-type">Semester Type</Label>
              <Select
                value={semesterForm.semesterType}
                onValueChange={(value: 'first' | 'second' | 'summer') =>
                  setSemesterForm(prev => ({ ...prev, semesterType: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select semester type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">1st Semester</SelectItem>
                  <SelectItem value="second">2nd Semester</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-level">Year Level</Label>
              <Select
                value={semesterForm.yearLevel.toString()}
                onValueChange={(value) =>
                  setSemesterForm(prev => ({ ...prev, yearLevel: parseInt(value) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddSemesterDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSemester} className="w-full sm:w-auto">
                Create Semester
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Semester Confirmation Dialog */}
      <AlertDialog open={isDeleteSemesterDialogOpen} onOpenChange={setIsDeleteSemesterDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this semester? This will also delete all courses in this semester. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteSemester}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSemester}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Semester
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Grade Data</DialogTitle>
          </DialogHeader>
          <CSVExporter
            academicRecord={academicRecord || {} as AcademicRecord}
            semesters={semesters}
            grades={grades}
            onExportStart={() => console.log('Export started')}
            onExportComplete={(result) => {
              showSuccess(`Successfully exported ${result.recordsExported} records to ${result.filename}`);
              setIsExportDialogOpen(false);
            }}
            onExportError={(error) => {
              showError(`Export failed: ${error}`);
            }}
            exportOptions={{
              includeCalculations: true,
              includeNotes: false,
              dateFormat: 'iso' as 'iso' | 'readable',
              filename: '',
              includeSummary: true,
              exportForReimport: true,
              exportBySemester: false,
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reset Data Confirmation Dialog */}
      <AlertDialog open={isResetDataDialogOpen} onOpenChange={setIsResetDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all your data? This will delete all semesters, courses, and grades. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Warning Dialog */}
      <AlertDialog open={isTemplateWarningDialogOpen} onOpenChange={setIsTemplateWarningDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Data?</AlertDialogTitle>
            <AlertDialogDescription>
              You have existing semesters and grades in your calculator. Loading this template will replace all current data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTemplateLoad}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTemplateLoad}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Semester Dialog */}
      <Dialog open={isEditSemesterDialogOpen} onOpenChange={setIsEditSemesterDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-academic-year">Academic Year</Label>
              <Input
                id="edit-academic-year"
                type="number"
                placeholder="2025"
                value={semesterForm.academicYear}
                onChange={(e) => setSemesterForm(prev => ({
                  ...prev,
                  academicYear: e.target.value
                }))}
                min="2000"
                max="2030"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-semester-type">Semester Type</Label>
              <Select
                value={semesterForm.semesterType}
                onValueChange={(value: 'first' | 'second' | 'summer') =>
                  setSemesterForm(prev => ({ ...prev, semesterType: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select semester type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">1st Semester</SelectItem>
                  <SelectItem value="second">2nd Semester</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year-level">Year Level</Label>
              <Select
                value={semesterForm.yearLevel.toString()}
                onValueChange={(value) =>
                  setSemesterForm(prev => ({ ...prev, yearLevel: parseInt(value) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditSemesterDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSemester} className="w-full sm:w-auto">
                Update Semester
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <CalculatorFooter />
      </div>
    </>
  );
}