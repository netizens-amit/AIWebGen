// src/pages/Projects.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
  Plus,
  FileCode,
  Calendar,
  Sparkles,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiService } from "@/services/api.service";
import { Project, ProjectStatus, CodeType } from "@/types/project.types";

export const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Initial fetch and Polling setup
  useEffect(() => {
    fetchProjects();

    const interval = setInterval(() => {
      setProjects((prev) => {
        // Only poll if we have active projects
        const isAnyProcessing = prev.some(
          (p) =>
            p.status === ProjectStatus.PROCESSING ||
            p.status === ProjectStatus.PENDING
        );
        if (isAnyProcessing) fetchProjects(true);
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiService.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleView = (project: Project) => {
    navigate("/preview", {
      state: { projectId: project.id },
    });
  };

  const handleDownload = async (project: Project) => {
    if (project.status !== ProjectStatus.COMPLETED) return;

    try {
      const response = await apiService.getSandpackFiles(project.id);
      const files = response.data.files;

      const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      // Handle downloads based on project type
      if (project.codeType === CodeType.REACT) {
         // Stagger downloads for React files
         const reactFiles = [
             { path: '/App.tsx', name: 'App.tsx', type: 'text/typescript' },
             { path: '/App.css', name: 'App.css', type: 'text/css' },
             { path: '/index.tsx', name: 'index.tsx', type: 'text/typescript' },
             { path: '/package.json', name: 'package.json', type: 'application/json' }
         ];
         
         reactFiles.forEach((f, index) => {
             if (files[f.path]) {
                 setTimeout(() => downloadFile(files[f.path], f.name, f.type), index * 100);
             }
         });
      } else {
         // Stagger downloads for HTML files
         const htmlFiles = [
             { path: '/index.html', name: 'index.html', type: 'text/html' },
             { path: '/styles.css', name: 'styles.css', type: 'text/css' },
             { path: '/script.js', name: 'script.js', type: 'text/javascript' }
         ];

         htmlFiles.forEach((f, index) => {
             if (files[f.path]) {
                 setTimeout(() => downloadFile(files[f.path], f.name, f.type), index * 100);
             }
         });
      }
      
    } catch (error) {
      console.error("Failed to download files:", error);
      alert("Failed to download project files.");
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      // Call the API to delete the project
      await apiService.deleteProject(projectId);
      
      // Remove from local state after successful deletion
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setDeletingId(null);
      setProjectToDelete(null);
    }
  };

  const handleRegenerate = async (project: Project) => {
    setRegeneratingId(project.id);
    try {
      const stream = apiService.generateWebsiteStream(
        { ...project } as any, // simplified for DTO compatibility
        `/generation/project/${project.id}/regenerate`
      );

      for await (const update of stream) {
        // Optimistically update local state
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  status: ProjectStatus.PROCESSING,
                  progress: update.progress,
                  errorMessage: undefined,
                }
              : p
          )
        );

        if (update.status === "completed") {
          fetchProjects(true); // Refresh full data on completion
        }
        
        if (update.status === "failed") {
             setProjects((prev) =>
                prev.map((p) =>
                  p.id === project.id
                    ? {
                        ...p,
                        status: ProjectStatus.FAILED,
                        errorMessage: update.message,
                        progress: 0,
                      }
                    : p
                )
              );
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Regeneration failed: " + (e.message || "Unknown error"));
    } finally {
      setRegeneratingId(null);
    }
  };

  const getStatusBadge = (status: ProjectStatus, progress: number) => {
    switch (status) {
      case ProjectStatus.COMPLETED:
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case ProjectStatus.PROCESSING:
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing {progress > 0 && `${progress}%`}
          </Badge>
        );
      case ProjectStatus.FAILED:
        return (
          <Badge variant="default" className="bg-red-500 hover:bg-red-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case ProjectStatus.PENDING:
        return (
          <Badge
            variant="default"
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="w-full max-w-8xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
            <p className="text-muted-foreground">
              Manage and view all your generated websites
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="default" onClick={() => fetchProjects()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="default" onClick={() => navigate("/")}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <Separator />

        {/* Projects Grid */}
        {projects?.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                Start by generating your first AI-powered website. It only takes
                a few minutes!
              </p>
              <Button size="lg" onClick={() => navigate("/")}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Your First Website
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <Card
                key={project.id}
                className={`group hover:shadow-lg transition-all duration-200 ${
                  project.status === ProjectStatus.PROCESSING ||
                  project.status === ProjectStatus.PENDING
                    ? "border-blue-200 dark:border-blue-800"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {project.companyName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span>{project.industry}</span>
                          <span>•</span>
                          <span>{project.designStyle}</span>
                        </div>
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status, project.progress)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Processing Indicator */}
                  {(project.status === ProjectStatus.PROCESSING ||
                    project.status === ProjectStatus.PENDING) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Generating website...
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            {project.progress}% completed
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Failed Indicator */}
                  {project.status === ProjectStatus.FAILED && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          Generation failed
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 truncate" title={project.errorMessage}>
                          {project.errorMessage || "Unknown error"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completed Project Info */}
                  {project?.status === ProjectStatus.COMPLETED && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileCode className="w-4 h-4" />
                          <span>Type</span>
                        </div>
                        <span className="font-medium text-xs px-2 py-0.5 rounded bg-muted">
                          {project.codeType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Zap className="w-4 h-4" />
                          <span>Files</span>
                        </div>
                        <span className="font-medium">
                            {/* Safely handle optional files array if not loaded yet */}
                            {project.files?.length || 0}
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Created{" "}
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleView(project)}
                      disabled={project.status !== ProjectStatus.COMPLETED}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(project)}
                      disabled={project.status !== ProjectStatus.COMPLETED}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    {project.status === ProjectStatus.FAILED && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={regeneratingId === project.id}
                        onClick={() => handleRegenerate(project)}
                      >
                        {regeneratingId === project.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Retry"
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setProjectToDelete(project.id)}
                      disabled={deletingId === project.id}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={() => setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              project and remove all associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && handleDelete(projectToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};