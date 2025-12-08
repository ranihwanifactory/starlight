import { GoogleGenAI } from "@google/genai";

// Vercel 및 다양한 환경(Vite, CRA 등)에서 API Key를 안전하게 가져오기 위한 유틸리티 함수
const getApiKey = (): string => {
  let key = "";
  
  try {
    // 1. process.env 체크 (Standard Node/CRA/Next.js/Webpack)
    // 브라우저 환경에서 ReferenceError를 방지하기 위해 try-catch로 감싸고 typeof 체크
    if (typeof process !== 'undefined' && process && process.env) {
      if (process.env.API_KEY) key = process.env.API_KEY;
      else if (process.env.REACT_APP_API_KEY) key = process.env.REACT_APP_API_KEY;
      else if (process.env.VITE_API_KEY) key = process.env.VITE_API_KEY;
    }
  } catch (e) {
    // process 접근 에러 무시
  }

  // 2. import.meta.env 체크 (Vite Client Side)
  if (!key) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
          // @ts-ignore
          if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
          // @ts-ignore
          else if (import.meta.env.API_KEY) key = import.meta.env.API_KEY;
      }
    } catch (e) {
      // import.meta 에러 무시
    }
  }
  
  return key;
};

const apiKey = getApiKey();

// API 키가 없으면 빈 문자열로 초기화 (요청 시 체크)
// "MISSING_KEY" 같은 더미 값을 넣으면 특정 검증에서 실패할 수 있으므로 빈 값 허용되는지 확인 필요하나, 
// GoogleGenAI SDK는 보통 요청 시점에 키를 사용함.
const ai = new GoogleGenAI({ apiKey: apiKey || "NO_KEY_PROVIDED" });

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

export const getLocationInfo = async (location: string, lat?: number, lng?: number): Promise<{text: string, links: {title: string, uri: string}[]} | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `
      이 장소(${location})에 대한 흥미로운 천문학적 또는 지리학적 사실을 한국어로 알려주세요.
      좌표(${lat}, ${lng})가 있다면, 천체 관측을 위한 관측 조건(광공해, 고도 등)을 정확하게 분석해주세요.
      별을 사랑하는 사람들에게 영감을 줄 수 있도록 간결하고 시적인 어조로 한국어로 작성해주세요.
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
      return null;
  }
}