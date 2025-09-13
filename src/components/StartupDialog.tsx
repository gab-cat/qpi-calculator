import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, BookTemplate, PlusCircle, Calculator, Database, AlertCircle } from 'lucide-react';

interface StartupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartupDialog({ open, onOpenChange }: StartupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="h-8 w-8 text-primary" />
            <DialogTitle className="text-2xl">Welcome to QPI Calculator</DialogTitle>
          </div>
          <DialogDescription className="text-lg">
            Your personal academic performance tracker. Calculate your Quality Point Index with ease.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* How It Works Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This app helps you track your academic performance by calculating your Quality Point Index (QPI).
                Add your courses, enter grades, and get instant calculations for each semester and your overall academic standing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <PlusCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm">Add Courses</h4>
                  <p className="text-xs text-muted-foreground">
                    Create semesters and add your courses with credits and grades
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm">Calculate QPI</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatic QPI calculation for each semester and cumulative
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm">Track Progress</h4>
                  <p className="text-xs text-muted-foreground">
                    Monitor your academic journey with detailed summaries
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookTemplate className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">Import Data</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload CSV files from student portals or spreadsheets to quickly import your existing academic records.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookTemplate className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">Use Templates</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start with pre-designed course templates for common academic programs and customize as needed.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">Start Fresh</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Build your academic record from scratch with complete control over semesters and courses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <div>
                <strong className="text-sm font-medium">Local Storage Only:</strong>
                <p className="text-sm mt-1">
                  Your grades and academic data are stored only in your browser's local storage.
                  This means your data will be lost if you clear your browser data or use a different device/browser.
                </p>
              </div>
              <div>
                <strong className="text-sm font-medium">Backup Recommendation:</strong>
                <p className="text-sm mt-1">
                  We strongly recommend exporting your data regularly to save it as a CSV file.
                  You can then import it back anytime to restore your academic records.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => onOpenChange(false)}
              size="lg"
              className="min-w-32"
            >
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
