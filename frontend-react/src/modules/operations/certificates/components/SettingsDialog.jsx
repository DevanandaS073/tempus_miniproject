import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { testOpenAIConnection, testGeminiConnection } from "@/lib/ai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, ShieldAlert, Check, Loader2, Wifi } from "lucide-react";

export function SettingsDialog() {
  const { aiProvider, apiKey, setAiProvider, setApiKey } = useSettingsStore();

  const [localProvider, setLocalProvider] = useState(aiProvider);
  const [localKey, setLocalKey] = useState(apiKey);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { type: 'success' | 'error', message: string }

  // Sync state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalProvider(aiProvider);
      setLocalKey(apiKey);
      setIsSaved(false);
      setTestResult(null);
    }
  }, [isOpen, aiProvider, apiKey]);

  const handleSave = () => {
    setAiProvider(localProvider);
    setApiKey(localKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 1000);
  };

  const handleTest = async () => {
    if (!localKey) {
      setTestResult({ type: 'error', message: 'Please enter an API key to test.' });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);

    try {
      if (localProvider === "openai") {
        await testOpenAIConnection(localKey);
      } else {
        await testGeminiConnection(localKey, localProvider);
      }
      setTestResult({ type: 'success', message: 'Connection successful!' });
    } catch (err) {
      setTestResult({ type: 'error', message: err.message || 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-none shadow-none bg-zinc-950 border-zinc-800 hover:bg-zinc-800 transition-all border",
            )}
          />
        }
      >
        <Settings className="w-5 h-5 text-zinc-500 hover:text-white" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-950/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-none border border-zinc-800">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold tracking-tight text-white uppercase">
            AI Configuration
          </DialogTitle>
          <DialogDescription className="text-zinc-500 uppercase tracking-widest text-[10px] font-mono mt-1">
            Vision settings for layout extraction.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-none flex gap-3 text-[11px] text-zinc-400 uppercase tracking-widest leading-relaxed">
            <ShieldAlert className="w-5 h-5 shrink-0 text-zinc-600" />
            <p>
              <strong>Security Protocol:</strong> Keys are stored in local storage
              only and <span className="text-white">never transmitted</span> to our infrastructure.
            </p>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="provider"
              className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]"
            >
              AI Provider
            </Label>
            <Select
              value={localProvider}
              onValueChange={(val) => {
                if (val) setLocalProvider(val);
              }}
            >
              <SelectTrigger id="provider" className="h-12 rounded-none border-zinc-800 bg-zinc-950 text-white focus:ring-0 focus:border-zinc-500">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-zinc-800 bg-zinc-950 text-white shadow-2xl">
                <SelectItem value="openai">OpenAI (gpt-4o)</SelectItem>
                <SelectItem value="gemini">
                  Gemini 2.5 Flash (Latest)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="apikey"
              className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]"
            >
              API Key
            </Label>
            <div className="flex gap-2">
              <Input
                id="apikey"
                type="password"
                placeholder={`Enter Token`}
                value={localKey}
                onChange={(e) => {
                  setLocalKey(e.target.value);
                  setTestResult(null);
                }}
                className="h-12 rounded-none border-zinc-800 bg-zinc-950 focus:border-zinc-500 text-white flex-1 font-mono text-xs"
              />
               <Button 
                onClick={handleTest} 
                variant="secondary"
                disabled={!localKey || isTesting}
                className="h-12 px-6 rounded-none bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 uppercase tracking-widest text-[10px] font-bold"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin text-zinc-500" /> : <Wifi className="w-4 h-4 mr-1.5" />}
                {isTesting ? "Validating" : "Test Link"}
              </Button>
            </div>
            {testResult && (
              <p className={`text-[10px] mt-1 flex items-start gap-1.5 uppercase font-mono tracking-widest ${
                testResult.type === 'success' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {testResult.type === 'success' ? <Check className="w-3 h-3 shrink-0 mt-0.5" /> : <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />}
                {testResult.message}
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-12 rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] shadow-none mt-2"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
