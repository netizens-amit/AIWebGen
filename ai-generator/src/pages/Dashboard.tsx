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
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  Zap,
  Loader2,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Wand2,
  Settings,
} from "lucide-react";
import { apiService } from "@/services/api.service";
import { useAuth } from "@/contexts/AuthContext";
import { websocketService } from "@/services/websocket.service";
import { GenerationProgress, Project } from "@/types/project.types"; // Import types

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]); // Use Project type
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  });

  useEffect(() => {
    fetchProjects();
    setupWebSocket();

    return () => {
      websocketService.offProgress();
      websocketService.offComplete();
      websocketService.offError();
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await apiService.getProjects(); // Now works!
      // Handle response structure: { success: true, data: [...] }
      const projectList = response.data || []; 
      setProjects(projectList);
      setStats(calculateStats(projectList));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsList: Project[]) => {
    const total = projectsList?.length || 0;
    const completed =
      projectsList?.filter((p) => p.status === "COMPLETED")?.length || 0;
    const processing =
      projectsList?.filter(
        (p) => p.status === "PROCESSING" || p.status === "PENDING" || p.status === "VALIDATING"
      )?.length || 0;
    const failed =
      projectsList?.filter((p) => p.status === "FAILED")?.length || 0;

    return { total, completed, processing, failed };
  };

  const setupWebSocket = () => {
    websocketService.connect();
    console.log("Dashboard WebSocket setup started");

    // Single listener for all progress updates (including completion/failure)
    websocketService.onProgress((data: GenerationProgress) => {
      console.log("Dashboard received progress:", data);

      setProjects((prevProjects) => {
        const updated = prevProjects.map((p) => {
          if (p.id === data.projectId) {
            // Map 'validating' (lowercase) to 'VALIDATING' (enum)
            const statusMap: Record<string, string> = {
              'processing': 'PROCESSING',
              'validating': 'VALIDATING',
              'completed': 'COMPLETED',
              'failed': 'FAILED'
            };
            
            return { 
              ...p, 
              status: (statusMap[data.status] || data.status) as any, 
              progress: data.progress,
              errorMessage: data.error 
            };
          }
          return p;
        });

        setStats(calculateStats(updated));
        return updated;
      });

      // Refresh list on completion to ensure consistency
      if (data.status === 'completed') {
         setTimeout(() => fetchProjects(), 1000);
      }
    });

    setTimeout(() => {
      if (!websocketService.isConnected()) {
        console.warn("WebSocket not connected, reconnecting...");
        websocketService.connect();
      }
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "PROCESSING":
      case "VALIDATING":
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {status === "VALIDATING" ? "Validating" : "Processing"}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="default" className="bg-red-500 hover:bg-red-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    // ... (Rest of the JSX remains identical)
    <div className="w-full h-full overflow-auto">
      <div className="w-full max-w-8xl mx-auto p-6 space-y-8">
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome back, {user?.name?.split(" ")[0] || "there"}!
              </h1>
              <p className="text-lg text-muted-foreground">
                Ready to create something amazing today?
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/generate")}
              className="gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generate New Website
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Total Projects */}
          <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-xs uppercase font-medium">
                    Total Projects
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {stats.total}
                  </CardTitle>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{stats.completed} completed</span>
              </div>
            </CardContent>
          </Card>
          {/* ... other stat cards ... */}
           <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-green-500/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-xs uppercase font-medium">
                    Completed
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600">
                    {stats.completed}
                  </CardTitle>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Successfully generated</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-blue-500/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-xs uppercase font-medium">
                    In Progress
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-blue-600">
                    {stats.processing}
                  </CardTitle>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Currently processing</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-red-500/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-xs uppercase font-medium">
                    Failed
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-600">
                    {stats.failed}
                  </CardTitle>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Need attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project List Section */}
          <Card className="lg:col-span-2 border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>
                    Your latest website generations
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/projects")}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Globe className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No projects yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Generate your first AI-powered website in just a few clicks!
                  </p>
                  <Button onClick={() => navigate("/generate")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Website
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects?.slice(0, 5)?.map((project) => (
                    <div
                      key={project.id}
                      className="group relative flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/preview/${project.id}`)} 
                    >
                      {(project.status === "PROCESSING" ||
                        project.status === "PENDING" || project.status === "VALIDATING") && (
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-lg" />
                      )}

                      <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold truncate">
                            {project.companyName || "Untitled Project"}
                          </h3>
                          {getStatusBadge(project.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {project.industry} • {project.designStyle}
                        </p>

                        {(project.status === "PROCESSING" ||
                          project.status === "PENDING" || project.status === "VALIDATING") && (
                          <div className="mt-2">
                            <Progress
                              value={project.progress || 0}
                              className="h-1.5"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="hidden sm:block">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions (Same as before) */}
          <div className="space-y-6">
             <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => navigate("/generate")}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">
                      Generate Website
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Create new AI website
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => navigate("/projects")}
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">My Projects</div>
                    <div className="text-xs text-muted-foreground">
                      View all websites
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => navigate("/settings")}
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">Settings</div>
                    <div className="text-xs text-muted-foreground">
                      Manage account
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Pro Tip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Use the color scheme picker to match your brand identity
                  perfectly. Custom colors make your generated websites truly
                  unique!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
