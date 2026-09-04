const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
console.log('Successfully initialized GoogleGenAI');
