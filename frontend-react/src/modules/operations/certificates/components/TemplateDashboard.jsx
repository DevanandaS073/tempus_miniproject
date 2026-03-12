import { useEffect, useState } from "react";
import { getTemplates, deleteTemplate } from "@/lib/storage";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileOutput, Layers, Pencil } from "lucide-react";

export function TemplateDashboard({ onCreateNew, onSelectTemplate, onEditTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await getTemplates();
    setTemplates(data);
    setIsLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(id);
      loadTemplates();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-zinc-500 animate-pulse uppercase tracking-widest text-xs font-bold">
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Your Templates</h2>
        <Button onClick={onCreateNew} className="rounded-none uppercase tracking-widest font-bold border border-zinc-800 bg-white text-black hover:bg-zinc-200">
          Create New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="border border-zinc-800 rounded-none p-12 text-center text-zinc-500 bg-zinc-900/30">
          <Layers className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
          <p className="mb-4 uppercase tracking-widest text-xs">You have no saved templates yet.</p>
          <Button variant="outline" onClick={onCreateNew} className="rounded-none border-zinc-700 hover:bg-zinc-800 transition-colors uppercase tracking-widest text-xs">
            Get Started
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="overflow-hidden bg-zinc-900/50 hover:border-zinc-500 transition-all border-zinc-800 flex flex-col rounded-none shadow-none"
            >
              <div className="h-48 bg-zinc-950 border-b border-zinc-800 p-2 relative group">
                <img
                  src={tpl.base64Image}
                  alt={tpl.name}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />

                <div className="absolute top-2 right-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-none shadow-none bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    onClick={(e) => handleDelete(tpl.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardHeader className="py-4">
                <CardTitle className="text-lg truncate font-bold uppercase tracking-tight">{tpl.name}</CardTitle>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-mono">
                  Created {new Date(tpl.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="py-0 pb-4 flex-grow text-sm text-zinc-400">
                <div className="flex justify-between items-center bg-zinc-950 p-2 border border-zinc-800 rounded-none font-mono text-[11px]">
                  <div>
                    <span className="font-semibold">
                      {tpl.layout.csv_schema.length}
                    </span>{" "}
                    Text Fields
                  </div>
                  <div>
                    <span className="font-semibold">
                      {tpl.layout.required_assets.length}
                    </span>{" "}
                    Asset Fields
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex gap-2">
                <Button
                  className="flex-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all rounded-none border border-zinc-700 uppercase tracking-widest text-xs font-bold py-5"
                  variant="secondary"
                  onClick={() => onSelectTemplate(tpl.id)}
                >
                  <FileOutput className="h-4 w-4 mr-2" />
                  Grant Award
                </Button>
                <Button
                  className="bg-zinc-800 text-zinc-400 hover:bg-indigo-600 hover:text-white transition-all rounded-none border border-zinc-700 uppercase tracking-widest text-xs font-bold py-5 px-4"
                  variant="secondary"
                  onClick={() => onEditTemplate(tpl.id)}
                  title="Edit template"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
