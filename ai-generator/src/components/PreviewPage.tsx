// src/components/PreviewPage.tsx

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sandpack } from '@codesandbox/sandpack-react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';

export const PreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams(); // Allow accessing by ID directly via URL

  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>(null);
  const [codeType, setCodeType] = useState<'REACT' | 'HTML'>('REACT');

  useEffect(() => {
    const init = async () => {
      // Scenario 1: Coming directly from Generation Form (files passed in state)
      if (location.state?.files) {
        setFiles(location.state.files);
        setMetadata(location.state.metadata);
        setCodeType(location.state.codeType);
        setLoading(false);
        return;
      }

      // Scenario 2: Loading from URL or Projects list (fetch from API)
      const projectId = location.state?.projectId || id;
      
      if (projectId) {
        try {
          const projectReq = await apiService.getProject(projectId);
          
          setMetadata({
            title: projectReq.data.companyName,
            description: `${projectReq.data.industry} • ${projectReq.data.designStyle}`,
            colorScheme: projectReq.data.colorScheme
          });
          setCodeType(projectReq.data.codeType as any);

          const filesReq = await apiService.getSandpackFiles(projectId);
          setFiles(filesReq.data.files);
        } catch (error) {
          console.error("Failed to load project", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    init();
  }, [location.state, id]);

  const downloadFiles = () => {
    if (!files) return;

    const downloadFile = (content: string, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    if (codeType === 'REACT') {
      if (files['/App.tsx']) downloadFile(files['/App.tsx'], 'App.tsx', 'text/typescript');
      if (files['/App.css']) setTimeout(() => downloadFile(files['/App.css'], 'App.css', 'text/css'), 100);
      if (files['/index.tsx']) setTimeout(() => downloadFile(files['/index.tsx'], 'index.tsx', 'text/typescript'), 200);
      if (files['/package.json']) setTimeout(() => downloadFile(files['/package.json'], 'package.json', 'application/json'), 300);
    } else {
      if (files['/index.html']) downloadFile(files['/index.html'], 'index.html', 'text/html');
      if (files['/styles.css']) setTimeout(() => downloadFile(files['/styles.css'], 'styles.css', 'text/css'), 100);
      if (files['/script.js']) setTimeout(() => downloadFile(files['/script.js'], 'script.js', 'text/javascript'), 200);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading project...</span>
      </div>
    );
  }

  if (!files || !metadata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <button
            onClick={() => navigate('/projects')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  const sandpackTemplate = codeType === 'REACT' ? 'react-ts' : 'static';

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900">
      [cite_start]{/* Top Control Bar [cite: 627] */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-white font-semibold text-lg flex items-center gap-2">
            {metadata.title}
            <span className="text-xs px-2 py-1 bg-blue-600 rounded-full">
              {codeType}
            </span>
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">{metadata.description}</p>
        </div>

        <button
          onClick={downloadFiles}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Download Files</span>
        </button>
      </div>

      [cite_start]{/* Full-Screen Sandpack [cite: 630] */}
      <div className="w-full h-full pt-16">
        <Sandpack
          files={files} // Backend now returns exactly what Sandpack needs [cite: 27, 196]
          template={sandpackTemplate}
          theme="dark"
          options={{
            showNavigator: true,
            showTabs: true,
            showLineNumbers: true,
            showInlineErrors: true,
            editorHeight: 'calc(100vh - 64px)',
            editorWidthPercentage: 50,
            closableTabs: false, // Keep tabs open to show file structure
            autorun: true,
          }}
          style={{
            height: 'calc(100vh - 64px)',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
};