// src/components/ModelSelector.tsx
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Zap } from "lucide-react";

export interface AIModelOption {
  id: "GEMINI" | "QWEN";
  name: string;
  description: string;
  free: boolean;
} 

interface Props {
  value: AIModelOption["id"];
  onChange: (id: AIModelOption["id"]) => void;
}

export const ModelSelector: React.FC<Props> = ({ value, onChange }) => {
  const [models, setModels] = useState<AIModelOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/generation/models")
      .then((res) => res.json())
      .then((result) => setModels(result.data))
      .catch(() =>
        setModels([
          {
            id: "GEMINI",
            name: "Gemini 2.0 Flash",
            description: "Google's newest AI, fast and powerful",
            free: false,
          },
          {
            id: "QWEN",
            name: "Qwen3 235B",
            description: "Alibaba Qwen, free via OpenRouter",
            free: true,
          },
        ])
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading AI models…</div>;
  return (
    <div>
      <label className="block text-sm font-medium mb-2">AI Model</label>
      <div className="grid grid-cols-2 gap-3">
        {models.map((model) => (
          <Card
            key={model.id}
            className={`relative p-3 cursor-pointer border-2 transition ${value === model.id ? "border-blue-500 bg-blue-50" : "bg-white"}`}
            onClick={() => onChange(model.id)}
          >
            {value === model.id && (
              <Check className="absolute top-3 right-3 text-blue-500 w-5 h-5" />
            )}
            <div className="flex gap-2 items-center">
              <div className={`w-8 h-8 rounded-full flex justify-center items-center
                ${model.id === "GEMINI" ? "bg-purple-200" : "bg-green-200"}`}>
                {model.id === "GEMINI" ? <Sparkles /> : <Zap />}
              </div>
              <div className="flex-1">
                <div className="font-bold">{model.name}</div>
                <div className="text-xs">{model.description}</div>
                {model.free && (
                  <span className="inline-block px-2 py-0.5 mt-1 text-xs bg-green-200 text-green-700 rounded">FREE</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
