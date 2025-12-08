import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ""; 

const ai = new GoogleGenAI({ apiKey });

export const enhanceJournalEntry = async (text: string, target: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return text;
  }

  try {
    const prompt = `
      당신은 천문학 전문가이자 고급 천문 잡지의 시적인 에디터입니다.
      아빠와 아들이 작성한 관측 노트를 바탕으로, 전문적이면서도 경이로움이 느껴지는 글로 다듬어주세요.
      한국어로 작성해야 합니다.
      
      관측 대상: ${target}
      작성된 노트: "${text}"
      
      150단어 이내로 작성하고, 마크다운 서식 없이 줄글로 작성해주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini enhancement failed:", error);
    return text; // Fallback to original text
  }
};

export const getLocationInfo = async (location: string, lat?: number, lng?: number): Promise<{text: string, links: {title: string, uri: string}[]}> => {
  if (!apiKey) return { text: "API Key unavailable.", links: [] };

  try {
    const prompt = `
      Tell me interesting astronomical or geographical facts about this location: ${location}.
      If coordinates are provided (${lat}, ${lng}), use them to be precise about the viewing conditions (light pollution, altitude, etc) for astronomy.
      Keep it brief and inspiring for a stargazer.
    `;

    const toolConfig: any = {};
    if (lat && lng) {
        toolConfig.retrievalConfig = {
            latLng: { latitude: lat, longitude: lng }
        };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleMaps: {}}],
        toolConfig: toolConfig
      }
    });

    // Extract Maps Grounding URLs
    const links: {title: string, uri: string}[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
            links.push({ title: chunk.web.title || 'Web Source', uri: chunk.web.uri });
        }
        if (chunk.maps?.uri) { // Maps specific URI
             links.push({ title: chunk.maps.title || 'Google Maps', uri: chunk.maps.uri });
        }
    });
    
    // De-duplicate links
    const uniqueLinks = links.filter((link, index, self) =>
        index === self.findIndex((t) => (
            t.uri === link.uri
        ))
    );

    return {
        text: response.text || "No information available.",
        links: uniqueLinks
    };

  } catch (error) {
      console.error("Gemini Location Grounding failed:", error);
      return { text: "Could not retrieve location info.", links: [] };
  }
}