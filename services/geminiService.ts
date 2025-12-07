import { GoogleGenAI, Type } from "@google/genai";
import { Product, Invoice, AiPrediction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInventoryPrediction = async (
  products: Product[],
  invoices: Invoice[]
): Promise<AiPrediction> => {
  
  const productSummary = products.map(p => 
    `${p.name} (Stock: ${p.currentStock}, Min: ${p.minStock}, P.Venta: ${p.price}, Costo: ${p.cost})`
  ).join('\n');

  // Filter last 15 invoices for context
  const recentActivity = invoices.slice(-15).map(inv => {
    return `${inv.date}: ${inv.type === 'SALE' ? 'Venta' : 'Compra/Reposición'} - Total: $${inv.totalAmount}. Items: ${inv.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`;
  }).join('\n');

  const prompt = `
    Actúa como un gerente de minimarket experto para "Buena Fe".
    Analiza el inventario y el historial financiero reciente (Facturación).
    
    INVENTARIO ACTUAL:
    ${productSummary}

    ACTIVIDAD RECIENTE (Facturación):
    ${recentActivity}

    Tu tarea es:
    1. Analizar el estado del inventario y el flujo de ventas.
    2. Predecir agotamientos.
    3. Sugerir compras inteligentes (productos que se venden rápido y dan buen margen).
    4. Dar un consejo financiero breve.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Resumen de estado general." },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  predictedDemand: { type: Type.STRING, description: "Predicción de demanda basada en historial" },
                  urgency: { type: Type.STRING, enum: ["Baja", "Media", "Alta"] }
                }
              }
            },
            restockRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  suggestedQuantity: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                }
              }
            },
            financialTip: { type: Type.STRING, description: "Un consejo breve sobre rentabilidad o flujo de caja." }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AiPrediction;

  } catch (error) {
    console.error("Error fetching AI prediction:", error);
    throw error;
  }
};