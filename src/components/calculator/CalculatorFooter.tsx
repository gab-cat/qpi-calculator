import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Shield, 
  Download, 
  Upload, 
  BookOpen, 
  Info, 
  Sparkles,
  GraduationCap,
  Database,
  Eye,
  Github
} from 'lucide-react';

export function CalculatorFooter() {
  return (
    <footer className="mt-12 border-t bg-gradient-to-r from-background via-muted/20 to-background">
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* What is this page */}
          <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">QPI Calculator</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A comprehensive tool to track your academic performance, calculate your Quality Point Index (QPI), 
                and monitor your progress across semesters. Perfect for students who want to stay on top of their grades.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Academic Tool
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* How to use */}
          <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">How to Use</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-medium">1.</span>
                  <span>Add semesters using the <strong>+</strong> button</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-medium">2.</span>
                  <span>Select a semester and add your courses</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-medium">3.</span>
                  <span>Enter your grades to see real-time QPI</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-medium">4.</span>
                  <span>Use templates for quick setup</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-0 bg-gradient-to-br from-green-500/5 to-green-600/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Data Management</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-green-600" />
                  <span><strong>Export:</strong> Download your data as CSV/Excel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span><strong>Import:</strong> Upload existing grade sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span><strong>Overview:</strong> View comprehensive analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span><strong>Templates:</strong> Save and reuse configurations</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">Privacy & Security</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Your Data Stays Local</p>
                    <p>All your academic data is stored locally in your browser. We don't collect, store, or transmit any of your personal information.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">100% Private</p>
                    <p>Your grades, courses, and academic records remain completely private and secure on your device.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom section with additional info */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>All data stored locally</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span>No account required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span>Completely free</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              <a
                href="https://github.com/gab-cat/qpi-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>View on GitHub</span>
              </a>
              
              <div className="text-xs text-muted-foreground text-center md:text-right">
                <p>Built with ❤️ for students who want to track their academic journey</p>
                <p className="mt-1">Your privacy is our priority - no data leaves your device</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
