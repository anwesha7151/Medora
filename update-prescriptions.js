const fs = require("fs");

const path = "src/routes/app.prescriptions.tsx";
let code = fs.readFileSync(path, "utf8");

code = code.replace(
  /import { createFileRoute, Link } from "@tanstack\/react-router";\nimport {/,
  `import { createFileRoute, Link } from "@tanstack/react-router";
import { ReviewerView } from "@/components/prescription/ReviewerView";
import {`,
);

code = code.replace(
  /function PrescriptionsPage\(\) {/,
  `
interface ReviewState {
  file: File | null;
  url?: string;
  template: Prescription;
  step: number;
}

const OCR_STEPS = [
  "Uploading document",
  "Reading document",
  "Extracting text",
  "Identifying medicines",
  "Extracting prescription instructions",
  "Preparing review"
];

function PrescriptionsPage() {
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
`,
);

code = code.replace(
  /const simulateTemplate = \(template: Prescription\) => \{[\s\S]*?\}, 1400\);\n  \};\n\n  const handleFile/m,
  `const simulateTemplate = (template: Prescription) => {
    setPreview({
      name: template.fileName,
      size: "340 KB",
    });
    setUploading(true);
    setProgress(0);
    
    // Simulate steps
    let currentStep = 0;
    const tick = window.setInterval(() => {
      setProgress((p) => {
         const next = Math.min(p + 3, 95);
         currentStep = Math.floor((next / 100) * OCR_STEPS.length);
         return next;
      });
    }, 50);

    window.setTimeout(() => {
      window.clearInterval(tick);
      setProgress(100);
      setUploading(false);
      
      const hydratedTemplate = {
        ...template,
        id: \`rx-\${Date.now()}\`,
        uploadedAt: new Date().toISOString(),
        status: "extracted" as const,
        items: template.items.map((i) => ({
          ...i,
          id: \`\${i.id}-\${Date.now()}\`,
          userConfirmed: false,
        })),
      };

      setReviewState({
        file: null,
        template: hydratedTemplate,
        step: OCR_STEPS.length,
      });
    }, 1800);
  };

  const handleFile`,
);

code = code.replace(
  /const template = selectPrescriptionProfile\(file.name, file.size\);\n      savePrescription\(\{[\s\S]*?\}\);\n      setUploading\(false\);\n      setProgress\(0\);\n      toast.success\(.*?\);\n    \}, 1600\);/m,
  `const template = selectPrescriptionProfile(file.name, file.size);
      
      const hydratedTemplate = {
        ...template,
        id: \`rx-\${Date.now()}\`,
        fileName: file.name.slice(0, 80),
        uploadedAt: new Date().toISOString(),
        status: "extracted" as const,
        items: template.items.map((i) => ({
          ...i,
          id: \`\${i.id}-\${Date.now()}\`,
          userConfirmed: false,
        })),
      };

      setUploading(false);
      setProgress(0);
      
      setReviewState({
        file,
        url: isImage ? URL.createObjectURL(file) : undefined,
        template: hydratedTemplate,
        step: OCR_STEPS.length,
      });
    }, 2000);`,
);

code = code.replace(
  /return \(\n    <div className="space-y-6">/,
  `return (
    <div className="space-y-6">
      {reviewState ? (
        <div className="fixed inset-0 z-50 bg-background">
           <ReviewerView
              prescription={reviewState.template}
              fileUrl={reviewState.url}
              fileType={reviewState.file?.type}
              onSave={(finalPrescription) => {
                 savePrescription(finalPrescription);
                 setReviewState(null);
                 setPreview(null);
                 toast.success("Prescription saved", {
                    description: "You have verified the extracted information."
                 });
              }}
              onCancel={() => {
                 if (confirm("Are you sure you want to cancel? Any unsaved review progress will be lost.")) {
                    setReviewState(null);
                    setPreview(null);
                 }
              }}
           />
        </div>
      ) : null}
`,
);

code = code.replace(
  /\{uploading && \([\s\S]*?<\/div>\n        \)\}/m,
  `{uploading && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{OCR_STEPS[Math.min(Math.floor((progress / 100) * OCR_STEPS.length), OCR_STEPS.length - 1)]}…</span>
              <span className="numeric">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}`,
);

fs.writeFileSync(path, code);
