import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event: any) => {
  try {
    const { city, day, vibe } = JSON.parse(event.body);

    const ai = new GoogleGenAI({ 
      apiKey: process.env.API_KEY 
    });

    const prompt = `Actúa como un cronista experto...`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return {
      statusCode: 200,
      body: response.text
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error generando itinerario" })
    };
  }
};
