import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testGemini() {
  const modelName = 'Brother'; // Pesquisa de teste
  const prompt = `Máquina de costura: ${modelName}
Liste até 10 modelos que correspondam à busca. Responda SOMENTE em um Array JSON válido, sem markdown, sem explicações:
[{"modelo":"nome completo","imageUrl":"URL pública ou null","intervaloHoras":número,"intervaloMeses":número,"pontosOleo":["lista"],"tipoOleo":"tipo","observacoes":"máximo 1 frase"}]`;

  console.log("Chamando Gemini API com o modelo:", modelName);

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      console.error("HTTP Erro:", response.status, response.statusText);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("Raw output length:", text.length);
    console.log("Raw output full text:\n", text);
    
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    
    console.log(`\nSucesso! Parseou ${parsed.length} items.`);
    console.log(parsed[0]);
  } catch (err) {
    console.error("Erro JSON parse:", err.message);
  }
}

testGemini();
