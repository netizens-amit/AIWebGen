// src/components/WebsiteGeneratorForm.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  Code,
  Palette,
  Zap,
  Cpu,
  Hospital,
  HandCoins,
  BookMarked,
  ShoppingCart,
  Utensils,
  MapPinHouse,
  BaggageClaim,
  BriefcaseBusiness,
  Rss,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/api.service";
import { GenerateWebsiteRequest, AIModel, CodeType } from "@/types/project.types";
import { websocketService } from "@/services/websocket.service"; // Kept for cleanup if needed, though logic moved to SSE

const colorPalettes = [
  { name: "Ocean Blue", primary: "#3b82f6", secondary: "#0ea5e9", accent: "#06b6d4" },
  { name: "Sunset Orange", primary: "#f97316", secondary: "#fb923c", accent: "#fbbf24" },
  { name: "Forest Green", primary: "#10b981", secondary: "#059669", accent: "#84cc16" },
  { name: "Royal Purple", primary: "#8b5cf6", secondary: "#a78bfa", accent: "#c084fc" },
  { name: "Rose Pink", primary: "#ec4899", secondary: "#f472b6", accent: "#fb7185" },
  { name: "Slate Gray", primary: "#64748b", secondary: "#94a3b8", accent: "#cbd5e1" },
];

const industries = [
  { value: "technology", label: "Technology", icon: <Cpu size={16} /> },
  { value: "healthcare", label: "Healthcare", icon: <Hospital size={16} /> },
  { value: "finance", label: "Finance", icon: <HandCoins size={16} /> },
  { value: "education", label: "Education", icon: <BookMarked size={16} /> },
  { value: "ecommerce", label: "E-commerce", icon: <ShoppingCart size={16} /> },
  { value: "restaurant", label: "Restaurant", icon: <Utensils size={16} /> },
  { value: "realestate", label: "Real Estate", icon: <MapPinHouse size={16} /> },
  { value: "travel", label: "Travel", icon: <BaggageClaim size={16} /> },
  { value: "portfolio", label: "Portfolio", icon: <BriefcaseBusiness size={16} /> },
  { value: "blog", label: "Blog", icon: <Rss size={16} /> },
];

const websiteTypes = [
  { value: "business", label: "Business" },
  { value: "portfolio", label: "Portfolio" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "landing", label: "Landing" },
];

const designStyles = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "creative", label: "Creative" },
  { value: "corporate", label: "Corporate" },
  { value: "elegant", label: "Elegant" },
  { value: "playful", label: "Playful" },
];

export const WebsiteGeneratorForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  
  const [models, setModels] = useState<any[]>([]);
  const [selectedColorTab, setSelectedColorTab] = useState<"palettes" | "custom">("palettes");
  
  const [formData, setFormData] = useState<GenerateWebsiteRequest>({
    companyName: "",
    industry: "technology",
    websiteType: "business",
    designStyle: "modern",
    codeType: CodeType.REACT,
    aiModel: AIModel.GEMINI,
    colorScheme: colorPalettes[0],
  });

  useEffect(() => {
    loadModels();
    // Clean up any lingering sockets from previous views
    websocketService.disconnect();
  }, []);

  const loadModels = async () => {
    try {
      const response = await apiService.getAvailableModels();
      setModels(response.data);
      // Default to first model if available
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, aiModel: response.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load models');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      alert('Company name is required');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusMessage("Initializing...");

    try {
      for await (const update of apiService.generateWebsiteStream(formData)) {
        setProgress(update.progress);
        setStatusMessage(update.message);

        if (update.status === 'completed') {
          setTimeout(() => {
            navigate('/preview', {
              state: {
                projectId: update.projectId,
                files: update.files, // Files are now passed directly from the completion event
                codeType: formData.codeType,
                metadata: {
                  title: formData.companyName,
                  description: `${formData.industry} • ${formData.designStyle}`,
                  colorScheme: formData.colorScheme,
                }
              }
            });
          }, 1000);
        }

        if (update.status === 'failed') {
            throw new Error(update.message || "Generation failed");
        }
      }

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to generate website');
      setLoading(false);
    }
  };

  const applyColorPalette = (palette: typeof colorPalettes[0]) => {
    setFormData({ ...formData, colorScheme: palette });
  };

  const updateColor = (colorType: "primary" | "secondary" | "accent", value: string) => {
    setFormData({
      ...formData,
      colorScheme: { ...formData.colorScheme, [colorType]: value },
    });
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Your Website</h1>
        <p className="text-muted-foreground">Configure your AI-powered website generation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Core Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Company Name */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-semibold flex items-center gap-2">
                    Company Name
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company or project name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    className="h-12 text-base border-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Industry and Type */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Industry</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          <span className="flex items-center gap-2">
                            <span>{ind.icon}</span>
                            <span>{ind.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Website Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.websiteType}
                    onValueChange={(value) => setFormData({ ...formData, websiteType: value })}
                  >
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {websiteTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Design Style */}
              <Card className="border-2 hover:border-primary/50 transition-colors sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Design Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {designStyles.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, designStyle: style.value })}
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                          formData.designStyle === style.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card hover:bg-accent border-border"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tech Stack and AI Model */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.codeType}
                    onValueChange={(value) => setFormData({ ...formData, codeType: value as CodeType })}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value={CodeType.HTML} id="html" className="peer sr-only" />
                      <Label
                        htmlFor="html"
                        className="flex flex-col gap-3 rounded-xl border-2 bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full"
                      >
                        <div className="font-bold text-base">HTML/CSS</div>
                        <div className="text-xs text-muted-foreground">Classic stack</div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value={CodeType.REACT} id="react" className="peer sr-only" />
                      <Label
                        htmlFor="react"
                        className="flex flex-col gap-3 rounded-xl border-2 bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full"
                      >
                        <div className="font-bold text-base">React + TS</div>
                        <div className="text-xs text-muted-foreground">Modern framework</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Model
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.aiModel}
                    onValueChange={(value) => setFormData({ ...formData, aiModel: value as AIModel })}
                    className="grid grid-cols-2 gap-4"
                  >
                    {models.map((model) => (
                      <div key={model.id}>
                        <RadioGroupItem value={model.id} id={model.id} className="peer sr-only" />
                        <Label
                          htmlFor={model.id}
                          className="flex items-start justify-between rounded-xl border-2 bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                              {model.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[100px]">{model.provider}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Styling & Submit */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Scheme
                </CardTitle>
                <CardDescription className="text-xs">Choose a palette or customize colors</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedColorTab} onValueChange={(v) => setSelectedColorTab(v as any)} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 h-9 gap-3">
                    <TabsTrigger value="palettes" className="text-xs">Palettes</TabsTrigger>
                    <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
                  </TabsList>

                  <TabsContent value="palettes" className="space-y-3 mt-4">
                    {colorPalettes.map((palette) => (
                      <button
                        key={palette.name}
                        type="button"
                        onClick={() => applyColorPalette(palette)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          formData.colorScheme.name === palette.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 bg-card"
                        }`}
                      >
                        <div className="flex gap-1.5">
                          <div className="w-6 h-6 rounded-md border-2 border-background shadow-sm" style={{ backgroundColor: palette.primary }} />
                          <div className="w-6 h-6 rounded-md border-2 border-background shadow-sm" style={{ backgroundColor: palette.secondary }} />
                          <div className="w-6 h-6 rounded-md border-2 border-background shadow-sm" style={{ backgroundColor: palette.accent }} />
                        </div>
                        <span className="text-sm font-medium flex-1 text-left">{palette.name}</span>
                        {formData.colorScheme.name === palette.name && <ChevronRight className="h-4 w-4" />}
                      </button>
                    ))}
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4 mt-4">
                    {["primary", "secondary", "accent"].map((colorType) => (
                      <div key={colorType} className="space-y-2">
                        <Label htmlFor={`${colorType}Color`} className="text-xs font-semibold uppercase tracking-wide">
                          {colorType}
                        </Label>
                        <div className="relative">
                          <Input
                            id={`${colorType}Color`}
                            type="text"
                            value={formData.colorScheme[colorType as keyof typeof formData.colorScheme]}
                            onChange={(e) => updateColor(colorType as "primary" | "secondary" | "accent", e.target.value)}
                            className="font-mono text-sm h-11 pl-14 border-2"
                            placeholder="#000000"
                          />
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <Input
                              type="color"
                              className="w-8 h-8 cursor-pointer border-2 rounded-md p-0.5"
                              value={formData.colorScheme[colorType as keyof typeof formData.colorScheme]}
                              onChange={(e) => updateColor(colorType as "primary" | "secondary" | "accent", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <div className="rounded-lg border-2 p-4 space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide mb-3">Preview</div>
                        <div className="grid grid-cols-3 gap-2">
                          {["primary", "secondary", "accent"].map((colorType) => (
                            <div key={colorType} className="space-y-1">
                              <div
                                className="w-full h-12 rounded-md border-2 border-background shadow-sm"
                                style={{ backgroundColor: formData.colorScheme[colorType as keyof typeof formData.colorScheme] }}
                              />
                              <div className="text-[10px] text-center text-muted-foreground capitalize">{colorType}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <Button type="submit" size="lg" disabled={loading} className="w-full h-12 text-base font-semibold">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {statusMessage || 'Generating...'} ({progress}%)
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Website
                    </>
                  )}
                </Button>
                
                {/* Progress Bar */}
                {loading && (
                    <div className="mt-4 space-y-2">
                        <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                            Step: {statusMessage}
                        </p>
                    </div>
                )}
                
                {!loading && (
                   <p className="text-center text-xs text-muted-foreground mt-3">
                      AI will generate your website in seconds
                   </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};