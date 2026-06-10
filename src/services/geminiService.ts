import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface MachineOilInfo {
  modelo: string;
  imageUrl: string | null;
  intervaloHoras: number;
  intervaloMeses: number;
  pontosOleo: string[];
  tipoOleo: string;
  observacoes: string;
}

export async function getMachineOilInfo(modelName: string): Promise<MachineOilInfo[]> {
  if (!API_KEY) {
    throw new Error('Gemini API key is missing. Please set GEMINI_API_KEY in your .env file.');
  }

  const prompt = `Máquina de costura: ${modelName}
Liste até 10 modelos que correspondam à busca. Responda SOMENTE em um Array JSON válido, sem markdown, sem explicações:
[{"modelo":"nome completo","imageUrl":"URL pública ou null","intervaloHoras":número,"intervaloMeses":número,"pontosOleo":["lista"],"tipoOleo":"tipo","observacoes":"máximo 1 frase"}]`;

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    throw new Error(`Error fetching data from Gemini: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No valid response from Gemini.');
  }

  // Remove possíveis backticks de markdown que o modelo pode adicionar
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err: any) {
    console.error("Failed to parse Gemini response. Raw output:", text);
    throw new Error(`Ocorreu um erro ao formatar os dados do Gemini. Tente novamente. (Erro: ${err.message})`);
  }
}
