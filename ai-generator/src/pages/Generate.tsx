// src/pages/NewProject.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { websocketService } from '@/services/websocket.service';
import { GenerateWebsiteRequest, CodeType, AIModel, AvailableModel } from '@/types/api.types';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLOR_PRESETS = [
  { name: 'Ocean', primary: '#0ea5e9', secondary: '#3b82f6', accent: '#06b6d4' },
  { name: 'Sunset', primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24' },
  { name: 'Forest', primary: '#10b981', secondary: '#059669', accent: '#84cc16' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c084fc' },
  { name: 'Rose', primary: '#ec4899', secondary: '#f472b6', accent: '#fb7185' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'travel', label: 'Travel' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'blog', label: 'Blog' },
];

const WEBSITE_TYPES = [
  { value: 'business', label: 'Business' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'blog', label: 'Blog' },
  { value: 'landing', label: 'Landing Page' },
];

const DESIGN_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'creative', label: 'Creative' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'playful', label: 'Playful' },
];

export const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<AvailableModel[]>([]);
  
  const [formData, setFormData] = useState<GenerateWebsiteRequest>({
    companyName: '',
    industry: 'technology',
    websiteType: 'business',
    designStyle: 'modern',
    codeType: CodeType.HTML,
    aiModel: AIModel.GEMINI,
    colorScheme: COLOR_PRESETS[0],
  });

  useEffect(() => {
    loadModels();
    const socket = websocketService.connect();

    websocketService.onProgress((data) => {
      toast.info(data.message, { duration: 2000 });
    });

    websocketService.onComplete((data) => {
      toast.success('Website generated successfully!');
    });

    websocketService.onError((data) => {
      toast.error(data.error);
    });

    return () => {
      websocketService.off('generation:progress');
      websocketService.off('generation:complete');
      websocketService.off('generation:error');
    };
  }, []);

  const loadModels = async () => {
    try {
      const response = await apiService.getAvailableModels();
      setModels(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, aiModel: response.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load AI models');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.generateWebsite(formData);
      toast.success('Generation started!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start generation');
      setLoading(false);
    }
  };

  const selectColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData({ ...formData, colorScheme: preset });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Create New Website</h1>
          <p className="text-slate-600">Fill in the details to generate your professional website</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Project Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Website Type</Label>
                  <Select
                    value={formData.websiteType}
                    onValueChange={(value) => setFormData({ ...formData, websiteType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBSITE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style">Design Style</Label>
                  <Select
                    value={formData.designStyle}
                    onValueChange={(value) => setFormData({ ...formData, designStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGN_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Code Type</h2>
                <RadioGroup
                  value={formData.codeType}
                  onValueChange={(value) => setFormData({ ...formData, codeType: value as CodeType })}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value={CodeType.HTML} id="html" className="peer sr-only" />
                    <Label
                      htmlFor="html"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                    >
                      <span className="font-semibold">HTML/CSS/JS</span>
                      <span className="text-xs text-slate-500 mt-1">Static Website</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value={CodeType.REACT} id="react" className="peer sr-only" />
                    <Label
                      htmlFor="react"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                    >
                      <span className="font-semibold">React + TS</span>
                      <span className="text-xs text-slate-500 mt-1">Modern SPA</span>
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">AI Model</h2>
                <RadioGroup
                  value={formData.aiModel}
                  onValueChange={(value) => setFormData({ ...formData, aiModel: value as AIModel })}
                  className="space-y-3"
                >
                  {models.map((model) => (
                    <div key={model.id}>
                      <RadioGroupItem value={model.id} id={model.id} className="peer sr-only" />
                      <Label
                        htmlFor={model.id}
                        className="flex items-center justify-between rounded-lg border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold">{model.name}</div>
                          <div className="text-xs text-slate-500">{model.description}</div>
                        </div>
                        {model.free && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                            FREE
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            </div>
          </div>

          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Color Scheme</h2>
            <div className="grid grid-cols-5 gap-4 mb-4">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectColorPreset(preset)}
                  className={`p-3 rounded-lg border-2 transition ${
                    formData.colorScheme.primary === preset.primary
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-6 h-6 rounded" style={{ background: preset.primary }} />
                    <div className="w-6 h-6 rounded" style={{ background: preset.secondary }} />
                    <div className="w-6 h-6 rounded" style={{ background: preset.accent }} />
                  </div>
                  <div className="text-xs font-medium text-center">{preset.name}</div>
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {['primary', 'secondary', 'accent'].map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.colorScheme[key as keyof typeof formData.colorScheme]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          colorScheme: { ...formData.colorScheme, [key]: e.target.value },
                        })
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.colorScheme[key as keyof typeof formData.colorScheme]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          colorScheme: { ...formData.colorScheme, [key]: e.target.value },
                        })
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-8 flex justify-end">
            <Button type="submit" size="lg" disabled={loading} className="px-8">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Website
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
