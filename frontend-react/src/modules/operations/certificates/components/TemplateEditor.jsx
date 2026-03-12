import { useState, useRef } from "react";
import { updateTemplate } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateRenderer } from "./CertificateRenderer";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  X,
  Save,
  Code2,
} from "lucide-react";

export function TemplateEditor({ template, onSaved, onCancel }) {
  const [name, setName] = useState(template.name);
  const [html, setHtml] = useState(template.layout.html);
  const [csvSchema, setCsvSchema] = useState([...template.layout.csv_schema]);
  const [requiredAssets, setRequiredAssets] = useState([...template.layout.required_assets]);

  const [hiddenFields, setHiddenFields] = useState([...(template.layout.hidden_fields || [])]);

  const [newField, setNewField] = useState("");
  const [newAsset, setNewAsset] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Build a dummy rowData from schema keys so the preview shows placeholder text
  const dummyRowData = Object.fromEntries(
    csvSchema.map((k) => [k, `[${k}]`])
  );

  const toggleHidden = (key) =>
    setHiddenFields((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));

  const removeField = (key) => {
    setCsvSchema((s) => s.filter((k) => k !== key));
    setHiddenFields((h) => h.filter((k) => k !== key));
  };
  const addField = () => {
    const k = newField.trim().toLowerCase().replace(/\s+/g, "_");
    if (!k || csvSchema.includes(k)) return;
    setCsvSchema((s) => [...s, k]);
    setNewField("");
  };

  const removeAsset = (key) => setRequiredAssets((s) => s.filter((k) => k !== key));
  const addAsset = () => {
    const k = newAsset.trim().toLowerCase().replace(/\s+/g, "_");
    if (!k || requiredAssets.includes(k)) return;
    setRequiredAssets((s) => [...s, k]);
    setNewAsset("");
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name cannot be empty."); return; }
    setError(null);
    setIsSaving(true);
    try {
      await updateTemplate(template.id, {
        name: name.trim(),
        layout: {
          ...template.layout,
          html,
          csv_schema: csvSchema,
          required_assets: requiredAssets,
          hidden_fields: hiddenFields,
        },
      });
      setSaved(true);
      setTimeout(() => onSaved(), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Edit Template</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}
            className="rounded-none border-zinc-700 text-zinc-500 hover:text-white hover:bg-zinc-800 uppercase tracking-widest text-xs font-bold">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || saved}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] px-6">
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />Saved</>
            ) : isSaving ? (
              <><span className="animate-pulse">Saving…</span></>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-none flex items-start gap-3 text-sm font-mono uppercase tracking-tight">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Template name */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">Template Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-zinc-900 border-zinc-700 rounded-none text-white font-bold uppercase tracking-wider focus-visible:ring-0 focus-visible:border-indigo-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left: schema editors ── */}
        <div className="space-y-6">
          {/* Text fields (csv_schema) */}
          <div className="border border-zinc-800 rounded-none overflow-hidden">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                Text Placeholders <span className="text-indigo-400">({csvSchema.length})</span>
              </span>
            </div>
            <div className="p-4 space-y-3 bg-zinc-950">
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {csvSchema.map((key) => {
                  const isHidden = hiddenFields.includes(key);
                  return (
                    <span key={key}
                      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs transition-all ${
                        isHidden
                          ? "bg-zinc-800/60 text-zinc-500 border-zinc-700 line-through"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                      <button
                        onClick={() => toggleHidden(key)}
                        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        title={isHidden ? "Click to show" : "Click to hide"}
                      >
                        {isHidden
                          ? <EyeOff className="w-3 h-3 text-zinc-500 shrink-0" />
                          : <Eye className="w-3 h-3 text-indigo-400/60 shrink-0" />
                        }
                        {`{{${key}}}`}
                      </button>
                      <button onClick={() => removeField(key)}
                        className="text-zinc-600 hover:text-red-400 transition-colors ml-0.5"
                        title="Remove field">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {csvSchema.length === 0 && (
                  <span className="text-zinc-600 text-xs font-mono">No text fields yet.</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addField()}
                  placeholder="new_field_key"
                  className="bg-zinc-900 border-zinc-700 rounded-none text-white text-xs font-mono focus-visible:ring-0 focus-visible:border-indigo-500 h-8"
                />
                <Button size="sm" onClick={addField}
                  className="rounded-none bg-indigo-600 hover:bg-indigo-500 text-white h-8 w-8 p-0 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image asset fields (required_assets) */}
          <div className="border border-zinc-800 rounded-none overflow-hidden">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                Image Asset Slots <span className="text-amber-400">({requiredAssets.length})</span>
              </span>
            </div>
            <div className="p-4 space-y-3 bg-zinc-950">
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {requiredAssets.map((key) => (
                  <span key={key}
                    className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 font-mono text-xs">
                    {key}
                    <button onClick={() => removeAsset(key)}
                      className="text-amber-400/60 hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {requiredAssets.length === 0 && (
                  <span className="text-zinc-600 text-xs font-mono">No image slots yet.</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAsset}
                  onChange={(e) => setNewAsset(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAsset()}
                  placeholder="asset_key_name"
                  className="bg-zinc-900 border-zinc-700 rounded-none text-white text-xs font-mono focus-visible:ring-0 focus-visible:border-amber-500 h-8"
                />
                <Button size="sm" onClick={addAsset}
                  className="rounded-none bg-amber-600 hover:bg-amber-500 text-white h-8 w-8 p-0 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* HTML source editor toggle */}
          <div className="border border-zinc-800 rounded-none overflow-hidden">
            <button
              className="w-full flex items-center justify-between bg-zinc-900 px-4 py-2 hover:bg-zinc-800 transition-colors"
              onClick={() => setShowHtmlEditor((v) => !v)}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" />
                HTML Source
              </span>
              <span className="text-[10px] text-zinc-600 font-mono uppercase">
                {showHtmlEditor ? "collapse ▲" : "expand ▼"}
              </span>
            </button>
            {showHtmlEditor && (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                className="w-full bg-zinc-950 text-zinc-300 font-mono text-xs p-4 h-72 resize-y border-t border-zinc-800 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="space-y-3">
          <button
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono hover:text-white transition-colors"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {showPreview && (
            <div className="border border-zinc-800 rounded-none bg-zinc-950 overflow-auto p-4 flex items-start justify-center"
              style={{ minHeight: "300px", maxHeight: "600px" }}>
              <div style={{ transform: "scale(0.6)", transformOrigin: "top center" }}>
                <CertificateRenderer
                  template={{ ...template, layout: { ...template.layout, html, csv_schema: csvSchema, required_assets: requiredAssets, hidden_fields: hiddenFields } }}
                  rowData={dummyRowData}
                  assets={{}}
                  scale={1}
                />
              </div>
            </div>
          )}

          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
            Preview uses placeholder text <span className="text-indigo-400">[field_name]</span> for all text fields. Assets will show as empty img slots.
          </p>
        </div>
      </div>
    </div>
  );
}
