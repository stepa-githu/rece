import { requireServerEnv } from "@/lib/env";
import type { Review, ToneProfile, Hotel } from "@/types";

function extractResponseText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text.trim();
  const output = Array.isArray(payload.output) ? payload.output : [];
  const parts: string[] = [];
  for (const item of output as Array<Record<string, unknown>>) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const block of content as Array<Record<string, unknown>>) if (typeof block.text === "string") parts.push(block.text);
  }
  return parts.join("\n").trim();
}

export async function generateReviewReply({ review, hotel, tone, knowledge }: { review: Review; hotel: Hotel; tone: ToneProfile; knowledge: string }) {
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const instructions = `Sei il guest relation manager di ${hotel.name}. Prepara UNA risposta pronta da pubblicare a una recensione.\n\nRegole inderogabili:\n- Scrivi nella stessa lingua della recensione; se non è identificabile usa ${hotel.default_language}.\n- Non inventare servizi, rimborsi, azioni correttive o contatti. Usa i fatti della struttura solo quando pertinenti.\n- Ringrazia, personalizza sui punti davvero citati e non ripetere tutta la recensione.\n- Se c'è una critica, riconosci l'esperienza senza metterti sulla difensiva e senza ammettere responsabilità legali.\n- Non citare l'intelligenza artificiale, il voto numerico o la piattaforma.\n- Restituisci solo il testo finale, senza titolo, virgolette o note.\n\nStile:\nFormalità ${tone.formality}/5; calore ${tone.warmth}/5; sintesi ${tone.concision}/5.\nApertura: ${tone.greeting_style}.\nFirma: ${tone.signature}.\nParole preferite: ${tone.preferred_words || "nessuna"}.\nParole vietate: ${tone.forbidden_words || "nessuna"}.\nIstruzioni: ${tone.extra_instructions || "nessuna"}.\nEsempi di stile:\n${tone.example_replies || "nessuno"}`;
  const input = `RECENSIONE\nAutore: ${review.author_name || "ospite anonimo"}\nLingua indicativa: ${review.language || "non disponibile"}\nTitolo: ${review.title || ""}\nTesto: ${review.body || ""}\nAspetti positivi: ${review.positive_text || ""}\nAspetti negativi: ${review.negative_text || ""}\n\nINFORMAZIONI VERIFICATE DELLA STRUTTURA\n${knowledge || "Nessuna informazione aggiuntiva disponibile. Evita dettagli specifici."}`;
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${requireServerEnv("OPENAI_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, store: false, instructions, input, max_output_tokens: 500 }) });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) { const error = result.error as { message?: string } | undefined; throw new Error(error?.message || `OpenAI API: errore ${response.status}`); }
  const text = extractResponseText(result); if (!text) throw new Error("Il modello non ha restituito una risposta.");
  return { text, model };
}

export function demoReply(review: Review, hotelName: string) {
  if (review.language === "fr") return `Merci ${review.author_name || ""} pour votre message. Nous sommes heureux que l’accueil et la proximité de la mer aient contribué à votre séjour. Au plaisir de vous recevoir à nouveau.\n\nL’équipe du ${hotelName}`;
  if (review.language === "en") return `Dear ${review.author_name || "Guest"}, thank you for taking the time to share your experience. We are delighted that you appreciated our team and location. We have also noted your comment carefully and hope to welcome you back for an even more comfortable stay.\n\nThe ${hotelName} team`;
  return `Grazie ${review.author_name || ""} per aver condiviso la sua esperienza. Siamo felici che abbia apprezzato l’accoglienza e la cura della struttura. Terremo in particolare considerazione il suggerimento che ci ha lasciato: ci aiuta a migliorare con attenzione. Speriamo di poterla accogliere di nuovo presto.\n\nLo staff del ${hotelName}`;
}
