require('dotenv').config();
const llmService = require('./ai/llmService');

async function runTests() {
    console.log("=== Testing Health Check (Initialization) ===");
    try {
        const healthResult = await llmService.genAI.models.generateContent({
            model: process.env.AI_MODEL || 'gemini-1.5-flash',
            contents: 'Say hello in one sentence.',
        });
        console.log("Health Check Response:", healthResult.text, "\n");
    } catch (e) {
        console.log("Health Check Failed:", e.message, "\n");
    }

    const tests = [
        "How do I login?",
        "I have ₹500. What should I order?",
        "What are the best hot items?",
        "What are the best sweet items?",
        "What are the best spicy items?",
        "I have ₹1000. Give me a combination of hot, sweet and spicy items."
    ];

    for (let test of tests) {
        console.log(`=== Testing: "${test}" ===`);
        try {
            const result = await llmService.generateProductRecommendation(test, null, null, null);
            console.log("Text Response:", result.text);
            if (result.products && result.products.length > 0) {
                console.log("Recommended Products:");
                result.products.forEach(p => console.log(` - ${p.name} (₹${p.price})`));
            } else {
                console.log("No products recommended.");
            }
        } catch (e) {
            console.error("Test Failed:", e.message);
        }
        console.log("\n");
    }
}

runTests();
