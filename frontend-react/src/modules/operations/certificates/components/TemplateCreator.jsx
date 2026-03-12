import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSettingsStore } from "@/store/useSettingsStore";
import { analyzeWithOpenAI, analyzeWithGemini } from "@/lib/ai";
import { saveTemplate } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  UploadCloud,
  AlertCircle,
  FileJson,
  CheckCircle2,
} from "lucide-react";

export function TemplateCreator({ onSaved, onCancel }) {
  const { aiProvider, apiKey } = useSettingsStore();
  const [file, setFile] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [layout, setLayout] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (e.g. max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File is too large. Please upload an image under 5MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLayout(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setBase64Image(event.target.result);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!base64Image) {
      setError("Please upload an image first.");
      return;
    }
    if (!apiKey) {
      setError(
        "Missing API Key. Please click the Settings icon in the top right to configure your AI Provider.",
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let result;
      if (aiProvider === "openai") {
        result = await analyzeWithOpenAI(base64Image, apiKey);
      } else {
        result = await analyzeWithGemini(base64Image, apiKey, aiProvider);
      }
      setLayout(result);
      setTemplateName(
        file?.name.replace(/\\.[^/.]+$/, "") + " Template" || "New Template",
      );
    } catch (err) {
      setError(
        err.message || "Failed to analyze image. Ensure your API key is valid.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!layout || !base64Image) return;
    if (!templateName.trim()) {
      setError("Please provide a name for this template.");
      return;
    }

    const newTemplate = {
      id: uuidv4(),
      name: templateName,
      base64Image,
      layout,
      createdAt: Date.now(),
    };

    try {
      await saveTemplate(newTemplate);
      onSaved();
    } catch (err) {
      setError(
        "Failed to save template to local storage. Your browser may be out of space.",
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight uppercase">
          Create New Template
        </h2>
        <Button variant="ghost" onClick={onCancel} className="rounded-none hover:bg-zinc-800 text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold">
          Cancel
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Column */}
        <div className="space-y-4">
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!base64Image ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-zinc-800 rounded-none p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-900/50 transition-colors h-96 group relative overflow-hidden"
            >
              <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-none mb-4 group-hover:border-zinc-500 transition-all">
                <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-1 uppercase tracking-tight">Upload Certificate</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                PNG, JPG, or WEBP (max. 5MB)
              </p>
            </div>
          ) : (
            <div className="relative rounded-none overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center h-96 group">
              <img
                src={base64Image}
                alt="Certificate Preview"
                className="max-h-full max-w-full object-contain p-4 mix-blend-lighten"
              />

              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Button
                  variant="secondary"
                  className="rounded-none border border-zinc-700 bg-white text-black hover:bg-zinc-200 uppercase tracking-widest text-xs font-bold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Reference Image
                </Button>
              </div>
            </div>
          )}

          {layout?.html && (
             <div className="mt-8 border border-zinc-800 rounded-none overflow-hidden bg-zinc-950 relative">
               <div className="bg-zinc-900 border-b border-zinc-800 p-2 text-[10px] font-mono text-zinc-500 text-center uppercase tracking-[0.2em]">
                  Preview Generated HTML
               </div>
               <div className="p-4 overflow-auto max-h-[500px] flex justify-center bg-zinc-900/30 design-preview">
                 <div
                   dangerouslySetInnerHTML={{ __html: layout.html }}
                   style={{
                     transform: 'scale(0.5)',
                     transformOrigin: 'top center',
                     width: 'max-content'
                   }}
                 />
               </div>
             </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-none flex items-start gap-3 text-sm font-mono uppercase tracking-tight">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Action / Results Column */}
        <div className="space-y-6">
          {!layout && (
            <Card className="shadow-none border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm rounded-none">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[24rem] gap-4">
                <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-none">
                  <FileJson className="w-8 h-8 text-zinc-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">
                    Ready for Analysis
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6 uppercase tracking-widest font-mono leading-relaxed">
                    Our Vision model will detect text placeholders, coordinates,
                    and required signatures.
                  </p>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-none bg-white text-black hover:bg-zinc-200 uppercase tracking-[0.2em] font-bold py-6 px-8"
                    onClick={handleAnalyze}
                    disabled={!base64Image || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Image"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {layout && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 p-4 rounded-none flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider">HTML Generation Complete</h4>
                  <p className="text-[10px] mt-1 opacity-90 font-mono uppercase tracking-widest leading-relaxed">
                    Successfully wrote raw HTML structure. Detected {layout.csv_schema?.length || 0}{" "}
                    text fields and {layout.required_assets?.length || 0}{" "}
                    image assets.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold mb-2 block uppercase tracking-[0.2em] text-zinc-500">
                    Template Name
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Marketing Course 2026"
                    className="rounded-none border-zinc-800 bg-zinc-950 focus:border-zinc-500 h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-4 rounded-none border border-zinc-800">
                    <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                      CSV Headers
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {layout.csv_schema.map((key) => (
                        <span
                          key={key}
                          className="bg-zinc-900 px-2 py-1 rounded-none text-[10px] font-mono border border-zinc-800 text-zinc-400"
                        >
                          {key}
                        </span>
                      ))}
                      {layout.csv_schema.length === 0 && (
                        <span className="text-xs text-zinc-700 font-mono">
                          None detected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-none border border-zinc-800">
                    <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                      Required Assets
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {layout.required_assets.map((key) => (
                        <span
                          key={key}
                          className="bg-zinc-900 text-blue-400 px-2 py-1 rounded-none text-[10px] font-mono border border-zinc-800"
                        >
                          {key}
                        </span>
                      ))}
                      {layout.required_assets.length === 0 && (
                        <span className="text-xs text-zinc-700 font-mono">
                          None detected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button size="lg" className="w-full mt-4 rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] py-6" onClick={handleSave}>
                  Save Template to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
