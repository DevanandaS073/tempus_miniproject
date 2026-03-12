import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TemplateDashboard } from "./components/TemplateDashboard";
import { TemplateCreator } from "./components/TemplateCreator";
import { TemplateEditor } from "./components/TemplateEditor";
import { FulfillmentFlow } from "./components/FulfillmentFlow";
import { SettingsDialog } from "./components/SettingsDialog";
import { Sparkles, Loader2, ArrowLeft, Settings } from "lucide-react";
import { getTemplateById } from "@/lib/storage";

export default function CertificateDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get("eventId");
  
  const [view, setView] = useState("dashboard");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // If we arrived without an eventId, we should probably warn or let them just manage templates
  
  const handleCreateNew = () => setView("create");
  const handleCancelCreate = () => setView("dashboard");
  const handleTemplateSaved = () => setView("dashboard");
  
  const handleEditTemplate = async (id) => {
    setLoadingTemplate(true);
    setView("edit");
    try {
      const tpl = await getTemplateById(id);
      setActiveTemplate(tpl);
    } catch (err) {
      console.error(err);
      setView("dashboard");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSelectTemplate = async (id) => {
    if (!eventId) {
      alert("No Event ID specified. Please select 'Award Certificates' from an Event in the Operations dashboard.");
      return;
    }
    setLoadingTemplate(true);
    setView("generate");
    try {
      const tpl = await getTemplateById(id);
      setActiveTemplate(tpl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 w-full max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/operations')}
            className="p-2 hover:bg-zinc-800 rounded-none transition-colors border border-zinc-800"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              Certificate Generation
            </h1>
            {eventId ? (
              <p className="text-zinc-500 text-sm tracking-wider uppercase">Awarding certificates for Event #{eventId}</p>
            ) : (
              <p className="text-zinc-500 text-sm tracking-wider uppercase">Template Management Mode</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SettingsDialog />
        </div>
      </div>

      <main className="bg-zinc-900/50 border border-zinc-800 rounded-none shadow-none p-6">
        {view === "dashboard" && (
          <TemplateDashboard
            onCreateNew={handleCreateNew}
            onSelectTemplate={handleSelectTemplate}
            onEditTemplate={handleEditTemplate}
          />
        )}

        {view === "create" && (
          <TemplateCreator
            onSaved={handleTemplateSaved}
            onCancel={handleCancelCreate}
          />
        )}

        {view === "edit" && (
          <div className="animate-in fade-in">
            {loadingTemplate ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Loading template...</p>
              </div>
            ) : activeTemplate ? (
              <TemplateEditor
                template={activeTemplate}
                onSaved={() => { setActiveTemplate(null); setView("dashboard"); }}
                onCancel={() => { setActiveTemplate(null); setView("dashboard"); }}
              />
            ) : null}
          </div>
        )}

        {view === "generate" && (
          <div className="animate-in fade-in">
            {loadingTemplate ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Loading template data...</p>
              </div>
            ) : activeTemplate ? (
              <FulfillmentFlow
                template={activeTemplate}
                eventId={eventId}
                onBack={() => setView("dashboard")}
              />
            ) : (
              <div className="text-center py-24 space-y-4">
                <h2 className="text-2xl font-bold text-red-600">
                  Template Not Found
                </h2>
                <p className="text-gray-500">
                  The selected template could not be loaded.
                </p>
                <button
                  className="underline text-zinc-500 hover:text-white transition-colors"
                  onClick={() => setView("dashboard")}
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
