import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { generateCertificatesWithFiles } from "@/lib/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileDown,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  ArrowRight,
  Send,
  Users,
} from "lucide-react";
import { CertificateRenderer } from "./CertificateRenderer";
import { useAuth } from "@/context/AuthContext";

// Format a date string into readable forms.
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function fmtDateShort(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
}

// Build a flat map of available source fields for a single row.
// Includes participant user fields, event-level fields (same for every row),
// and useful computed values.
function buildSourceFields(rawParticipant, eventData) {
  const u = rawParticipant.user || rawParticipant;

  // Participant fields
  const participantFlat = {};
  Object.entries(u).forEach(([k, v]) => {
    if (v !== null && v !== undefined && typeof v !== "object")
      participantFlat[k] = String(v);
  });

  // Event fields (prefixed with event_ to avoid clashing with participant keys)
  const eventFlat = {};
  if (eventData) {
    const prefix = (k, v) => { if (v != null) eventFlat[`event_${k}`] = String(v); };
    prefix("title",       eventData.title);
    prefix("type",        eventData.event_type);
    prefix("description", eventData.description);
    prefix("location",    eventData.location);
    prefix("start_date",  fmtDate(eventData.start_date));
    prefix("start_date_short", fmtDateShort(eventData.start_date));
    prefix("end_date",    fmtDate(eventData.end_date));
    prefix("end_date_short",   fmtDateShort(eventData.end_date));
    if (eventData.creator) {
      const c = eventData.creator;
      eventFlat["event_organizer"] = [c.first_name, c.last_name].filter(Boolean).join(" ");
    }
    if (eventData.company?.name) {
      eventFlat["event_company"] = eventData.company.name;
    }
  }

  // Computed convenience fields
  const computed = {
    full_name:   [u.first_name, u.last_name].filter(Boolean).join(" "),
    today:       new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    today_short: new Date().toLocaleDateString(),
  };

  return { ...participantFlat, ...eventFlat, ...computed };
}

export function FulfillmentFlow({ template, eventId, onBack }) {
  const [step, setStep] = useState("fetch");
  const [rawParticipants, setRawParticipants] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [sourceFields, setSourceFields] = useState({});   // key→example value from first participant
  const [mapping, setMapping] = useState({});              // templateKey → sourceKey
  const [participants, setParticipants] = useState([]);    // final mapped rows
  const [assets, setAssets] = useState({});
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [generatedFiles, setGeneratedFiles] = useState([]); // [{email, name, filename, pdfBase64}]
  const [sendStatus, setSendStatus] = useState(null); // null | 'sending' | {sent, failed, errors}
  const { token } = useAuth();

  useEffect(() => {
    if (step === "fetch" && eventId) fetchAll();
  }, [step, eventId]);

  const fetchAll = async () => {
    try {
      setError(null);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch event details and participants in parallel
      const [eventRes, participantsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`, { headers }),
        fetch(`/api/events/${eventId}/participants`, { headers }),
      ]);

      if (!eventRes.ok) throw new Error("Failed to fetch event details");
      if (!participantsRes.ok) throw new Error("Failed to fetch event participants");

      const [event, data] = await Promise.all([eventRes.json(), participantsRes.json()]);

      if (data.length === 0) throw new Error("No attendees found for this event.");

      setEventData(event);
      setRawParticipants(data);

      // Build available source fields from the first participant + event data as examples
      const fields = buildSourceFields(data[0], event);
      setSourceFields(fields);

      // Pre-populate mapping with best-guess matches (case-insensitive key similarity)
      const schemaKeys = template.layout.csv_schema;
      const sourceKeys = Object.keys(fields);
      const initialMapping = {};
      schemaKeys.forEach((tKey) => {
        const normalised = tKey.toLowerCase().replace(/[\s_-]/g, "");
        const match = sourceKeys.find(
          (sKey) => sKey.toLowerCase().replace(/[\s_-]/g, "") === normalised,
        );
        initialMapping[tKey] = match || "";
      });
      setMapping(initialMapping);
      setStep("mapping");
    } catch (err) {
      setError(err.message);
    }
  };

  const applyMapping = () => {
    const unmapped = template.layout.csv_schema.filter((k) => !mapping[k]);
    if (unmapped.length > 0) {
      setError(`Please map all fields. Unmapped: ${unmapped.join(", ")}`);
      return;
    }
    setError(null);

    // Build the final rows using the chosen mapping
    const mapped = rawParticipants.map((raw) => {
      const src = buildSourceFields(raw, eventData);
      const row = {};
      template.layout.csv_schema.forEach((tKey) => {
        row[tKey] = src[mapping[tKey]] ?? "";
      });
      return row;
    });

    setParticipants(mapped);
    setStep(template.layout.required_assets.length > 0 ? "assets" : "preview");
  };

  const handleAssetUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string")
        setAssets((prev) => ({ ...prev, [key]: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const startPreview = () => {
    const missingAssets = template.layout.required_assets.filter((key) => !assets[key]);
    if (missingAssets.length > 0) {
      setError(`Missing images for: ${missingAssets.join(", ")}`);
      return;
    }
    setStep("preview");
  };

  const handleGenerate = async () => {
    setStep("generating");
    setError(null);
    setProgress(0);
    setSendStatus(null);
    try {
      const { zipBlob, individuals } = await generateCertificatesWithFiles(template, participants, assets, (current) => {
        setProgress(current);
      });
      saveAs(zipBlob, `${template.name.replace(/\s+/g, "_")}_certificates.zip`);

      // Pair each individual PDF with its recipient email + display name
      const files = individuals.map((ind, i) => {
        const raw = rawParticipants[i];
        const u   = raw?.user || raw || {};
        return {
          ...ind,
          email: u.email || "",
          name:  [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || `Recipient ${i + 1}`,
        };
      });
      setGeneratedFiles(files);
      setStep("done");
    } catch (err) {
      setError(err.message || "An unexpected error occurred during PDF generation.");
      setStep("assets");
    }
  };

  const handleSendAll = async () => {
    setSendStatus('sending');
    const recipients = generatedFiles
      .filter((f) => f.email)
      .map(({ email, filename, pdfBase64 }) => ({ email, filename, pdfBase64 }));

    try {
      const res = await fetch('/api/certificates/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          recipients,
          eventTitle: eventData?.title || '',
          senderName: '',
        }),
      });
      const data = await res.json();
      setSendStatus({ sent: data.sent ?? 0, failed: data.failed ?? 0, errors: data.errors ?? [] });
    } catch (err) {
      setSendStatus({ sent: 0, failed: recipients.length, errors: [{ email: 'all', error: err.message }] });
    }
  };

  // Split available source fields into labelled groups for the dropdown
  const sourceGroups = {
    "Participant": Object.keys(sourceFields).filter(
      (k) => !k.startsWith("event_") && k !== "full_name" && k !== "today" && k !== "today_short"
    ),
    "Event Details": Object.keys(sourceFields).filter((k) => k.startsWith("event_")),
    "Computed": ["full_name", "today", "today_short"].filter((k) => k in sourceFields),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight uppercase">
          Generate: {template.name}
        </h2>
        <Button variant="outline" onClick={onBack} className="rounded-none border-zinc-700 text-zinc-500 hover:text-white hover:bg-zinc-800 uppercase tracking-widest text-xs font-bold transition-all">
          Cancel
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-none flex items-start gap-3 text-sm font-mono uppercase tracking-tight animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Step 1: Fetching ── */}
      {step === "fetch" && (
        <Card className="shadow-none border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in rounded-none">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-6">
            <Loader2 className="w-12 h-12 text-zinc-500 animate-spin" />
            <div>
              <h3 className="font-bold text-xl mb-2 uppercase tracking-tight">Fetching Attendees...</h3>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono">
                Pulling verified participants from the database for Event #{eventId}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Field mapping ── */}
      {step === "mapping" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 p-4 rounded-none flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider">
                {rawParticipants.length} Attendees Fetched
              </h4>
              <p className="text-[10px] mt-1 opacity-90 font-mono uppercase tracking-[0.2em]">
                Map each certificate placeholder to the correct participant data field.
              </p>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-none overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 gap-0 bg-zinc-900 border-b border-zinc-800 px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
                Certificate Placeholder
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
                Data Field → Example Value
              </span>
            </div>

            {template.layout.csv_schema.map((tKey, i) => (
              <div
                key={tKey}
                className={`grid grid-cols-2 gap-4 items-center px-4 py-3 ${
                  i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"
                } border-b border-zinc-800/50 last:border-b-0`}
              >
                {/* Left: template placeholder key */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5">
                    {`{{${tKey}}}`}
                  </span>
                </div>

                {/* Right: grouped source field dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <select
                    value={mapping[tKey] || ""}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [tKey]: e.target.value }))
                    }
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-xs font-mono px-2 py-1.5 rounded-none focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">— select field —</option>
                    {Object.entries(sourceGroups).map(([groupLabel, keys]) =>
                      keys.length === 0 ? null : (
                        <optgroup key={groupLabel} label={groupLabel}>
                          {keys.map((sKey) => (
                            <option key={sKey} value={sKey}>
                              {sKey}
                              {sourceFields[sKey] ? ` (e.g. "${String(sourceFields[sKey]).slice(0, 28)}")` : ""}
                            </option>
                          ))}
                        </optgroup>
                      )
                    )}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="lg"
              className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] py-6 px-10"
              onClick={applyMapping}
            >
              Apply &amp; Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Upload assets ── */}
      {step === "assets" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 p-4 rounded-none flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider">Mapping Applied</h4>
              <p className="text-[10px] mt-1 opacity-90 font-mono uppercase tracking-[0.2em]">
                {participants.length} certificates queued. Upload the required images below.
              </p>
            </div>
          </div>

          <h3 className="font-bold text-lg uppercase tracking-tight">Upload Required Template Images</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {template.layout.required_assets.map((assetKey) => (
              <div key={assetKey} className="border border-zinc-800 rounded-none p-4 flex flex-col gap-3 bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-zinc-600" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">{assetKey}</span>
                </div>
                {assets[assetKey] ? (
                  <div className="h-24 bg-zinc-950 rounded-none flex items-center justify-center p-2 border border-emerald-500/20">
                    <img src={assets[assetKey]} className="max-h-full max-w-full object-contain mix-blend-lighten" alt={assetKey} />
                  </div>
                ) : (
                  <div className="h-24 bg-zinc-950 rounded-none flex flex-col items-center justify-center border border-zinc-800 cursor-pointer hover:bg-zinc-900 transition-colors">
                    <label className="cursor-pointer text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] w-full h-full flex items-center justify-center">
                      Upload Source
                      <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleAssetUpload(assetKey, e)} />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep("mapping")} className="rounded-none border-zinc-700 text-zinc-500 hover:text-white hover:bg-zinc-800 uppercase tracking-widest text-xs font-bold">
              Back
            </Button>
            <Button
              size="lg"
              className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] py-6 px-10"
              onClick={startPreview}
              disabled={template.layout.required_assets.some((k) => !assets[k])}
            >
              Preview Certificates
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Preview ── */}
      {step === "preview" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-3 uppercase tracking-tight">
              <Eye className="w-5 h-5 text-zinc-500" />
              Live DOM Preview — showing certificate #1 of {participants.length}
            </h3>
            <Button variant="ghost" className="rounded-none border border-zinc-800 hover:bg-zinc-800 uppercase tracking-widest text-xs font-bold"
              onClick={() => setStep(template.layout.required_assets.length > 0 ? "assets" : "mapping")}>
              Back
            </Button>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-none overflow-hidden flex items-center justify-center p-4 relative" style={{ minHeight: "300px" }}>
            <div className="transform scale-50 sm:scale-75 md:scale-100 origin-top flex items-center justify-center">
              <CertificateRenderer template={template} rowData={participants[0] || {}} assets={assets} scale={1} />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 text-zinc-500 p-4 rounded-none text-[10px] uppercase font-mono tracking-widest text-center">
            Final high-resolution PDFs will preserve this exact DOM layout.
          </div>

          <Button size="lg" className="w-full mt-4 rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] py-6" onClick={handleGenerate}>
            Confirm &amp; Generate {participants.length} PDFs
          </Button>
        </div>
      )}

      {/* ── Step 5: Generating ── */}
      {step === "generating" && (
        <Card className="shadow-none border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in rounded-none">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-6">
            <Loader2 className="w-12 h-12 text-zinc-500 animate-spin" />
            <div>
              <h3 className="font-bold text-xl mb-2 uppercase tracking-tight">Generating Batch...</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mb-4">
                Processing {participants.length} PDFs directly in browser.
              </p>
              <div className="font-mono text-zinc-100 font-bold border border-zinc-700 bg-zinc-950 px-4 py-2 text-lg">
                {progress} / {participants.length}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 6: Done ── */}
      {step === "done" && (
        <Card className="shadow-none border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md animate-in fade-in zoom-in-95 rounded-none">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="bg-zinc-950 p-6 border border-emerald-500/20 rounded-none mb-2">
              <FileDown className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="w-full max-w-md">
              <h3 className="font-bold text-2xl mb-2 text-emerald-500 uppercase tracking-tight">Success</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mb-6">
                {participants.length} certificates generated &amp; ZIP downloaded.
              </p>

              {/* Send to participants section */}
              {sendStatus === null && (
                <div className="border border-zinc-800 rounded-none p-4 mb-6 text-left bg-zinc-900/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">
                      Send to {generatedFiles.filter(f => f.email).length} Participants
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mb-4">
                    Each participant with a Tempus account will receive a notification with their individual certificate to download.
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 mb-4 pr-1">
                    {generatedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] font-mono py-0.5">
                        <span className="text-zinc-400 truncate max-w-[60%]">{f.name}</span>
                        <span className={`text-[10px] truncate max-w-[38%] ${
                          f.email ? 'text-zinc-600' : 'text-red-500/60'
                        }`}>
                          {f.email || 'no email'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleSendAll}
                    className="w-full rounded-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-[0.2em] py-4"
                    disabled={!generatedFiles.some(f => f.email)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Certificates
                  </Button>
                </div>
              )}

              {sendStatus === 'sending' && (
                <div className="border border-zinc-800 rounded-none p-4 mb-6 text-left bg-zinc-900/50 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Sending certificates…</span>
                </div>
              )}

              {sendStatus && sendStatus !== 'sending' && (
                <div className={`border rounded-none p-4 mb-6 text-left ${
                  sendStatus.failed === 0
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}>
                  <p className="text-xs font-bold uppercase tracking-widest font-mono mb-1">
                    <span className="text-emerald-400">{sendStatus.sent} sent</span>
                    {sendStatus.failed > 0 && (
                      <span className="text-amber-400 ml-2">{sendStatus.failed} failed</span>
                    )}
                  </p>
                  {sendStatus.errors?.length > 0 && (
                    <ul className="text-[10px] text-zinc-500 font-mono mt-2 space-y-0.5">
                      {sendStatus.errors.map((e, i) => (
                        <li key={i}>{e.email}: {e.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <Button size="lg" onClick={onBack} variant="outline"
                className="w-full rounded-none border-zinc-700 bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] py-6 px-10">
                Return to Gateway
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


