import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseCSV, validateCSVStructure } from '@/lib/csv-handler/csv-import';
import type { CSVRow } from '@/lib/csv-handler/csv-import';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface CSVImporterProps {
  onImportStart: () => void;
  onImportSuccess: (data: ImportResult) => void;
  onImportError: (errors: ImportError[]) => void;
  onImportCancel: () => void;
  acceptedFormats: string[];
  maxFileSize: number;
  showPreview: boolean;
}

interface ImportResult {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: ImportError[];
  preview: ImportPreviewItem[];
  gradeRecords?: Array<{
    courseId: string;
    courseCode: string;
    courseTitle: string;
    units: number;
    numericalGrade?: number;
    semesterId: string;
  }>;
  semesterGroups?: Record<string, ImportPreviewItem[]>;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ImportPreviewItem {
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
}

export function CSVImporter({
  onImportStart,
  onImportSuccess,
  onImportError,
  onImportCancel,
  acceptedFormats = ['.csv', '.xlsx'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  showPreview = true,
}: CSVImporterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<ImportPreviewItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [parent] = useAutoAnimate();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFilePreview = useCallback(async (file: File) => {
    console.log('Starting file processing for:', file.name);
    setIsProcessing(true);
    setProgress(10);

    try {
      let csvContent: string = '';

      // Read file content based on file type
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        csvContent = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        // Handle CSV files
        csvContent = await file.text();
      }

      setProgress(30);

      // Parse CSV content
      const csvData = parseCSV(csvContent);
      setProgress(50);

      // Validate CSV structure
      const validation = validateCSVStructure(csvData);
      if (!validation.isValid) {
        console.error('CSV validation failed:', validation.errors);
        onImportError(validation.errors.map(error => ({
          row: 0,
          field: 'validation',
          value: file.name,
          message: error
        })));
        return;
      }

      setProgress(70);

      // Detect column format and create mappings - match csv-import.ts logic
      const firstRow = csvData[0];
      const columnMappings = {
        courseCode: 'Course Code' in firstRow ? 'Course Code' : ('courseCode' in firstRow ? 'courseCode' : 'courseCode'),
        title: 'Course Title' in firstRow ? 'Course Title' : ('courseTitle' in firstRow ? 'courseTitle' : 'title'),
        units: 'Units' in firstRow ? 'Units' : ('units' in firstRow ? 'units' : 'units'),
        numericalGrade: 'Numerical Grade' in firstRow ? 'Numerical Grade' : ('numericalGrade' in firstRow ? 'numericalGrade' : 'numericalGrade'),
        semester: 'Semester' in firstRow ? 'Semester' : ('semester' in firstRow ? 'semester' : null), // Optional
        academicYear: 'Academic Year' in firstRow ? 'Academic Year' : ('academicYear' in firstRow ? 'academicYear' : null), // Optional
        yearLevel: 'Year Level' in firstRow ? 'Year Level' : ('yearLevel' in firstRow ? 'yearLevel' : null), // Optional
      };

      // Convert to preview items
      const previewData: ImportPreviewItem[] = csvData.map((row: CSVRow, index: number) => {
        const rowIndex = index + 1;
        const warnings: string[] = [];

        // Get values using column mappings
        const courseCode = row[columnMappings.courseCode];
        const title = row[columnMappings.title];
        const unitsValue = row[columnMappings.units];
        const numericalGradeValue = row[columnMappings.numericalGrade];   
        let semester = columnMappings.semester ? row[columnMappings.semester] : '';
        let academicYear = columnMappings.academicYear ? row[columnMappings.academicYear] : '';
        const yearLevelValue = columnMappings.yearLevel ? row[columnMappings.yearLevel] : undefined;

        // Normalize academic year format (handle both "2025" and "2024-2025")
        if (academicYear && academicYear.length === 4 && /^\d{4}$/.test(academicYear)) {
          // If it's just "2025", convert to "2024-2025" format
          const year = parseInt(academicYear);
          academicYear = `${year - 1}-${year}`;
        }

        // Normalize semester format
        semester = semester.toLowerCase().trim();

        // Validate individual fields
        if (!courseCode || courseCode.length < 3 || courseCode.length > 20) {
          warnings.push('Invalid course code');
        }
        if (!title || title.length < 1 || title.length > 200) {
          warnings.push('Invalid course title');
        }
        const units = parseFloat(unitsValue);
        if (isNaN(units) || units <= 0 || units > 6) {
          warnings.push('Invalid units (must be 0.5-6)');
        }
        const grade = numericalGradeValue ? parseFloat(numericalGradeValue) : undefined;
        if (grade !== undefined && (isNaN(grade) || grade < 0 || grade > 100)) {
          warnings.push('Invalid grade (must be 0-100)');
        }
        const yearLevel = yearLevelValue ? parseInt(yearLevelValue) : undefined;
        if (yearLevel !== undefined && (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 5)) {
          warnings.push('Invalid year level (must be 1-5)');
        }

        return {
          row: rowIndex,
          courseCode: courseCode || '',
          courseTitle: title || '',
          units: units || 0,
          grade: grade,
          semester: semester || '',
          academicYear: academicYear || '',
          yearLevel: yearLevel,
          isValid: warnings.length === 0,
          warnings
        };
      });

      setProgress(100);
      setPreviewData(previewData);
      console.log('Preview data ready:', previewData.length, 'records');
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('File processing error:', error);
      onImportError([{
        row: 0,
        field: 'processing',
        value: file.name,
        message: error instanceof Error ? error.message : 'Failed to process file'
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [onImportError]);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      onImportError([{
        row: 0,
        field: 'file',
        value: file.name,
        message: `File type not supported. Please use: ${acceptedFormats.join(', ')}`
      }]);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      onImportError([{
        row: 0,
        field: 'file',
        value: file.name,
        message: `File too large. Maximum size is ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`
      }]);
      return;
    }

    setSelectedFile(file);
    if (showPreview) {
      processFilePreview(file);
    }
  }, [acceptedFormats, maxFileSize, onImportError, showPreview, processFilePreview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleImportConfirm = async () => {
    if (!selectedFile || !previewData) return;

    setIsProcessing(true);
    setShowPreviewDialog(false);
    onImportStart();

    try {
      setProgress(20);

      // Group data by semester/academic year to create semesters if needed
      const semesterGroups: Record<string, ImportPreviewItem[]> = {};
      const validData = previewData.filter(item => item.isValid);

      validData.forEach(item => {
        // Use the normalized values that were processed above
        const normalizedSemester = item.semester.toLowerCase().trim();
        const normalizedAcademicYear = item.academicYear;

        // Normalize academic year for grouping key
        let finalAcademicYear = normalizedAcademicYear;
        if (finalAcademicYear && finalAcademicYear.length === 4 && /^\d{4}$/.test(finalAcademicYear)) {
          const year = parseInt(finalAcademicYear);
          finalAcademicYear = `${year - 1}-${year}`;
        }

        const key = `${finalAcademicYear}-${normalizedSemester}`;
        console.log(`Creating semester group key: '${key}' for course: ${item.courseCode} (${normalizedSemester}, ${finalAcademicYear})`);
        if (!semesterGroups[key]) {
          semesterGroups[key] = [];
        }
        semesterGroups[key].push(item);
      });

      console.log('Semester groups created:', semesterGroups);

      setProgress(50);

      // Convert valid data to grade records format (without extra semester/academic year properties)
      const gradeRecords = validData.map(item => ({
        courseId: `course-${item.courseCode}`, // Generate course ID
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
        units: item.units,
        numericalGrade: item.grade,
        semesterId: '', // Will be set when semester is created/found
        // Note: semester and academicYear info is stored in semesterGroups, not in gradeRecords
      }));

      console.log('Grade records created:', gradeRecords);

      setProgress(80);

      const result: ImportResult = {
        totalRecords: previewData.length,
        importedRecords: validData.length,
        skippedRecords: previewData.filter(item => !item.isValid).length,
        errors: previewData
          .filter(item => !item.isValid)
          .map(item => ({
            row: item.row,
            field: 'grade',
            value: '',
            message: item.warnings[0] || 'Invalid record'
          })),
        preview: previewData,
        gradeRecords,
        semesterGroups
      };

      setProgress(100);
      setImportResult(result);

      console.log('=== IMPORT DEBUG INFO ===');
      console.log('Sending import result to CalculatorPage:');
      console.log('- Grade records:', gradeRecords.length, gradeRecords);
      console.log('- Semester groups keys:', Object.keys(semesterGroups));
      console.log('- Semester groups:', semesterGroups);
      console.log('========================');

      onImportSuccess(result);
    } catch (error) {
      console.error('Import confirmation error:', error);
      onImportError([{
        row: 0,
        field: 'import',
        value: '',
        message: error instanceof Error ? error.message : 'Import failed'
      }]);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setShowPreviewDialog(false);
    setProgress(0);
  };

  const downloadTemplate = () => {
    // Create and download a CSV template using the same format as the exporter
    const csvContent = "Course Code,Course Title,Units,Numerical Grade,Semester,Academic Year\nCS-101,Introduction to Computer Science,3,95,First Semester,2023-2024\nMATH-101,College Algebra,3,88,First Semester,2023-2024\nENG-101,English Composition,3,92,First Semester,2023-2024";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qpi_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (importResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Import Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{importResult.importedRecords}</div>
              <div className="text-sm text-muted-foreground">Imported</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{importResult.skippedRecords}</div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{importResult.totalRecords}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {importResult.errors.length} records had issues and were skipped.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <Button onClick={handleReset}>
              Import Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Import Grade Data</span>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = acceptedFormats.join(',');
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files[0]) {
                  handleFileSelect(files[0]);
                }
              };
              input.click();
            }}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">
              {isDragging ? 'Drop your file here' : 'Choose file or drag & drop'}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Supported formats: {acceptedFormats.join(', ')}
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
            </p>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Remove
                </Button>
              </div>

              {/* Quick Import Button */}
              <div className="flex justify-center">
                <Button onClick={() => processFilePreview(selectedFile)} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Preview & Import'}
                </Button>
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Processing file... {progress}%
              </p>
            </div>
          )}

          {/* Format Info */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Your CSV should include columns: Course Code, Course Title, Units, Numerical Grade, Semester, Academic Year, Year Level (optional)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={() => setShowPreviewDialog(false)}>
        <DialogContent className="!max-w-5xl w-full max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Review the data before importing. Invalid records will be skipped.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4 text-sm">
              <Badge variant="default">
                {previewData.filter(item => item.isValid).length} valid
              </Badge>
              <Badge variant="destructive">
                {previewData.filter(item => !item.isValid).length} invalid
              </Badge>
              <Badge variant="outline">
                {previewData.length} total
              </Badge>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Course</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Units</th>
                      <th className="text-left p-2">Grade</th>
                      <th className="text-left p-2">Semester</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody ref={parent}>
                    {previewData.map((item) => (
                      <tr key={item.row} className={item.isValid ? '' : 'bg-destructive/10'}>
                        <td className="p-2 font-medium">{item.courseCode}</td>
                        <td className="p-2 truncate max-w-48">{item.courseTitle}</td>
                        <td className="p-2">{item.units}</td>
                        <td className="p-2">{item.grade || '—'}</td>
                        <td className="p-2 text-xs">{item.semester} {item.academicYear}</td>
                        <td className="p-2 text-xs">{item.yearLevel || '—'}</td>
                        <td className="p-2">
                          {item.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onImportCancel}>
                Cancel
              </Button>
              <Button onClick={handleImportConfirm}>
                Import {previewData.filter(item => item.isValid).length} Records
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}