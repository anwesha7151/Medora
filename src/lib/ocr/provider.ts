import { Prescription, PrescriptionItem } from "@/lib/domain";
import { demoPrescriptions } from "@/data/demo-catalog";

export interface OCRResult {
  prescription: Omit<Prescription, "id" | "status" | "uploadedAt" | "items">;
  items: Omit<PrescriptionItem, "id" | "userConfirmed">[];
}

export interface OCRProvider {
  extractPrescription(file: File): Promise<OCRResult>;
  name: string;
}

interface ExtractedItemRaw {
  medicineText?: string;
  strength?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  confidence?: number;
}

export class DemoOCRProvider implements OCRProvider {
  name = "Demo Template OCR";

  async extractPrescription(file: File): Promise<OCRResult> {
    // Simulate realistic OCR latency
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const lower = file.name.toLowerCase();
    let template: Prescription = demoPrescriptions[0]!;

    if (
      lower.includes("diabet") ||
      lower.includes("bp") ||
      lower.includes("heart")
    ) {
      template = demoPrescriptions[1]!;
    } else if (
      lower.includes("asthma") ||
      lower.includes("allergy") ||
      lower.includes("lung")
    ) {
      template = demoPrescriptions[2]!;
    } else if (
      lower.includes("ortho") ||
      lower.includes("pain") ||
      lower.includes("bone")
    ) {
      template = demoPrescriptions[3]!;
    } else {
      let hash = file.size;
      for (let i = 0; i < file.name.length; i++) {
        hash = (hash << 5) - hash + file.name.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % demoPrescriptions.length;
      template = demoPrescriptions[index] ?? demoPrescriptions[0]!;
    }

    return {
      prescription: {
        fileName: file.name.slice(0, 80),
        prescriberName: template.prescriberName,
        patientName: template.patientName,
      },
      items: template.items.map((item) => ({
        medicineText: item.medicineText,
        strength: item.strength,
        frequency: item.frequency,
        duration: item.duration,
        notes: item.notes,
        confidence: item.confidence,
      })),
    };
  }
}

export class HybridGeminiOCRProvider implements OCRProvider {
  name = "Gemini Multimodal OCR + Demo Fallback";
  private demoFallback = new DemoOCRProvider();

  async extractPrescription(file: File): Promise<OCRResult> {
    const apiKey =
      (typeof import.meta !== "undefined" &&
        import.meta.env?.["VITE_GEMINI_API_KEY"]) ||
      "";

    // If file is an image and Gemini API key is available, run live multimodal extraction
    if (apiKey && file.type.startsWith("image/")) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `You are an expert OCR clinical pharmacist for Medora Healthcare.
Analyze this medical prescription image carefully and extract all prescribed medicines in JSON format.
Output JSON structure:
{
  "prescriberName": "Doctor name or clinic if visible",
  "patientName": "Patient name if visible",
  "items": [
    {
      "medicineText": "Medicine name (e.g. Amoxicillin)",
      "strength": "Dose strength (e.g. 500 mg)",
      "frequency": "Frequency (e.g. Twice daily)",
      "duration": "Duration (e.g. 5 days)",
      "notes": "Instructions (e.g. Take after meals)",
      "confidence": 0.95
    }
  ]
}
Output strictly valid JSON.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: file.type,
                        data: cleanBase64,
                      },
                    },
                    { text: prompt },
                  ],
                },
              ],
            }),
          },
        );

        if (response.ok) {
          const result = await response.json();
          const rawText =
            result.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanJson = rawText.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(cleanJson);

          if (
            parsed.items &&
            Array.isArray(parsed.items) &&
            parsed.items.length > 0
          ) {
            return {
              prescription: {
                fileName: file.name.slice(0, 80),
                prescriberName:
                  parsed.prescriberName || "Extracted via Gemini Vision",
                patientName: parsed.patientName || undefined,
              },
              items: (parsed.items as ExtractedItemRaw[]).map((i) => ({
                medicineText: String(i.medicineText || "Medication"),
                strength: String(i.strength || "Standard"),
                frequency: String(i.frequency || "Once daily"),
                duration: String(i.duration || "As advised"),
                notes: i.notes ? String(i.notes) : undefined,
                confidence:
                  typeof i.confidence === "number" ? i.confidence : 0.9,
              })),
            };
          }
        }
      } catch (err) {
        console.warn(
          "[OCR] Live Gemini Vision encountered an issue, falling back to template extraction:",
          err,
        );
      }
    }

    // Default fallback to offline demo template parser
    return this.demoFallback.extractPrescription(file);
  }
}

// Current active provider
export const ocrProvider: OCRProvider = new HybridGeminiOCRProvider();
