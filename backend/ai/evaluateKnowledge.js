const intentDetector = require('./intentDetector');
const productEngine = require('./productEngine');

/**
 * Basic evaluation suite for Intent Detector and Product Engine
 */
function evaluateKnowledge() {
    let passed = 0;
    let failed = 0;

    console.log("=== Running AI Evaluation Suite ===\n");

    // 1. Test Budget Intent
    console.log("Testing Budget Extraction...");
    const q1 = "I have 500 rs, what can I get?";
    const res1 = intentDetector.detect(q1);
    if (res1.intents.includes('BUDGET_RECOMMENDATION') && res1.entities.budget === 500) {
        console.log("✅ Budget Intent Passed");
        passed++;
    } else {
        console.log("❌ Budget Intent Failed", res1);
        failed++;
    }

    // 2. Test Category Recommendation
    console.log("Testing Category Recommendation...");
    const q2 = "Looking for something spicy and hot";
    const res2 = intentDetector.detect(q2);
    if (res2.intents.includes('SPICY_RECOMMENDATION') && res2.intents.includes('HOT_RECOMMENDATION')) {
        console.log("✅ Category Intent Passed");
        passed++;
    } else {
        console.log("❌ Category Intent Failed", res2);
        failed++;
    }

    // 3. Test Product Engine (Budget Limits)
    console.log("Testing Product Engine Budget Caps...");
    const budgetRes = productEngine.getProductsForBudget(200, [], 2);
    if (budgetRes.total <= 200) {
        console.log("✅ Product Engine Budget Passed");
        passed++;
    } else {
        console.log("❌ Product Engine Budget Failed", budgetRes);
        failed++;
    }

    // 4. Test Cart Context Requirements
    console.log("Testing Context Requirements...");
    const q4 = "Add the second one to my cart";
    const res4 = intentDetector.detect(q4);
    if (res4.isUserContext) {
        console.log("✅ Context Requirements Passed");
        passed++;
    } else {
        console.log("❌ Context Requirements Failed", res4);
        failed++;
    }

    console.log(`\n=== Evaluation Complete ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
}

evaluateKnowledge();
