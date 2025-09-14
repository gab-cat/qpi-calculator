import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Calculator, BookOpen, GraduationCap } from 'lucide-react';
import type { SemesterRecord, GradeRecord } from '@/lib/types/academic-types';
import { convertNumericalToLetter, convertNumericalToGradePoint, isValidNumericalGrade } from '@/lib/calculations/grade-scale';
import { calculateQPI } from '@/lib/calculations/qpi-calculator';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface GradeTableProps {
  semesterId: string;
  semester: SemesterRecord;
  grades: GradeRecord[];
  onGradeUpdate: (gradeId: string, updates: Partial<GradeRecord>) => void;
  onGradeDelete: (gradeId: string) => void;
  onAddCourse: (courseInfo: { courseId: string; courseCode: string; title: string; units: number }) => void;
  onOpenCourseDialog?: () => void;
  readOnly?: boolean;
  showCalculations?: boolean;
}

interface GradeTableState {
  editingGradeId: string | null;
  tempGradeValue: string;
  validationErrors: Record<string, string>;
  isCalculating: boolean;
}

export function GradeTable({
  semester,
  grades,
  onGradeUpdate,
  onGradeDelete,
  onAddCourse,
  onOpenCourseDialog,
  readOnly = false,
  showCalculations = true
}: GradeTableProps) {
  const [state, setState] = useState<GradeTableState>({
    editingGradeId: null,
    tempGradeValue: '',
    validationErrors: {},
    isCalculating: false,
  });
  const [parent] = useAutoAnimate();

  // Calculate semester summary
  const semesterSummary = useMemo(() => {
    const totalUnits = grades.reduce((sum, grade) => sum + (grade.units || 0), 0);
    const qpi = calculateQPI(grades);
    const completedCourses = grades.filter(g => g.numericalGrade !== null && g.numericalGrade !== undefined).length;
    
    return {
      totalUnits,
      qpi: qpi || 0,
      completedCourses,
      totalCourses: grades.length,
      completionRate: grades.length > 0 ? (completedCourses / grades.length) * 100 : 0,
    };
  }, [grades]);

  const handleGradeEdit = useCallback((gradeId: string, currentValue: number | undefined) => {
    setState(prev => ({
      ...prev,
      editingGradeId: gradeId,
      tempGradeValue: currentValue?.toString() || '',
      validationErrors: { ...prev.validationErrors, [gradeId]: '' }
    }));
  }, []);

  const handleGradeUpdate = useCallback((gradeId: string) => {
    const numericValue = parseFloat(state.tempGradeValue);
    const isValid = isValidNumericalGrade(numericValue);
    
    if (!isValid) {
      setState(prev => ({
        ...prev,
        validationErrors: { ...prev.validationErrors, [gradeId]: 'Grade must be between 0 and 100' }
      }));
      return;
    }

    onGradeUpdate(gradeId, { numericalGrade: numericValue });
    setState(prev => ({
      ...prev,
      editingGradeId: null,
      tempGradeValue: '',
      validationErrors: { ...prev.validationErrors, [gradeId]: '' }
    }));
  }, [state.tempGradeValue, onGradeUpdate]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, gradeId: string) => {
    if (e.key === 'Enter') {
      handleGradeUpdate(gradeId);
    } else if (e.key === 'Escape') {
      setState(prev => ({ ...prev, editingGradeId: null, tempGradeValue: '' }));
    }
  }, [handleGradeUpdate]);

  const getGradeBadgeVariant = (grade: number | undefined): "default" | "destructive" | "outline" | "secondary" => {
    if (!grade) return "outline";
    if (grade >= 90) return "default";
    if (grade >= 75) return "secondary";
    return "destructive";
  };

  const getGradeBadgeText = (grade: number | undefined): string => {
    if (!grade) return "No Grade";
    const letterGrade = convertNumericalToLetter(grade);
    return `${grade} (${letterGrade})`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-neutral-900" />
              <CardTitle className="text-lg font-bold text-primary">
                {semester.semesterType === 'first' ? '1st Semester' :
                 semester.semesterType === 'second' ? '2nd Semester' :
                 'Summer'} {semester.academicYear}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-sm self-start sm:self-auto">
              Year {semester.yearLevel}
            </Badge>
          </div>


          {showCalculations && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{semesterSummary.totalUnits}</span>
                <span className="text-muted-foreground">units</span>
              </div>
              <div className="flex items-center gap-1">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-lg">
                  {semesterSummary.qpi.toFixed(2)}
                </span>
                <span className="text-muted-foreground">QPI</span>
              </div>
            </div>
          )}
        </div>

        {showCalculations && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
            <span>{semesterSummary.completedCourses} of {semesterSummary.totalCourses} courses completed</span>
            <div className="hidden sm:block">
              <Separator orientation="vertical" className="h-4" />
            </div>
            <span>{semesterSummary.completionRate.toFixed(0)}% completion</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {grades.length === 0 ? (
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              No courses added yet. Add courses to start calculating your QPI.
            </AlertDescription>
          </Alert>
        ) : (
          <div ref={parent} className="space-y-2">
            {grades.map((grade) => (
              <div key={grade.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm">{grade.courseCode}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {grade.units} {grade.units === 1 ? 'unit' : 'units'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {grade.courseTitle}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    {state.editingGradeId === grade.id ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Input
                          value={state.tempGradeValue}
                          onChange={(e) => setState(prev => ({ ...prev, tempGradeValue: e.target.value }))}
                          onKeyDown={(e) => handleKeyPress(e, grade.id)}
                          onBlur={() => handleGradeUpdate(grade.id)}
                          placeholder="Enter grade"
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        {state.validationErrors[grade.id] && (
                          <span className="text-xs text-destructive sm:hidden">
                            {state.validationErrors[grade.id]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant={getGradeBadgeVariant(grade.numericalGrade)}
                        className="cursor-pointer min-w-[80px] justify-center touch-manipulation"
                        onClick={() => !readOnly && handleGradeEdit(grade.id, grade.numericalGrade)}
                      >
                        {getGradeBadgeText(grade.numericalGrade)}
                      </Badge>
                    )}

                    {showCalculations && grade.numericalGrade && (
                      <div className="text-xs text-muted-foreground">
                        {convertNumericalToGradePoint(grade.numericalGrade).toFixed(1)} GP
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGradeDelete(grade.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive touch-manipulation flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Mobile validation error display */}
                {state.editingGradeId === grade.id && state.validationErrors[grade.id] && (
                  <div className="text-xs text-destructive sm:hidden">
                    {state.validationErrors[grade.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!readOnly && (
          <>
            <Separator />
            <Button
              variant="default"
              onClick={() => {
                if (onOpenCourseDialog) {
                  onOpenCourseDialog();
                } else {
                  // Fallback for backward compatibility
                  const newCourse = {
                    courseId: `temp-${Date.now()}`,
                    courseCode: 'NEW-COURSE',
                    title: 'New Course',
                    units: 3,
                  };
                  onAddCourse(newCourse);
                }
              }}
              className="w-full touch-manipulation"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}