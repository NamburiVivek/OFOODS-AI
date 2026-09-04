const customerAnalyzer = require('./customerAnalyzer');
const recoveryPredictor = require('./recoveryPredictor');
const llmService = require('./llmService');

class AIRecoveryAgent {
    async processDropoffEvent(dbPool, eventType, referenceId, userId, details) {
        try {
            // 1. Analyze customer context
            const features = await customerAnalyzer.analyze(dbPool, userId);
            
            // 2. Predict probability
            const probability = recoveryPredictor.calculateProbability(features, details.cartTotal);
            
            // 3. Ask LLM for strategy
            const strategy = await llmService.generateRecoveryStrategy(
                features, 
                eventType, 
                details.reason, 
                details.cartTotal, 
                probability
            );

            // 4. Create AI Recovery Case in DB
            const [result] = await dbPool.query(`
                INSERT INTO ai_recovery_cases 
                (type, reference_id, user_id, status, recovery_probability, ai_recommendation, action_taken)
                VALUES (?, ?, ?, 'pending', ?, ?, ?)
            `, [
                eventType, 
                referenceId, 
                userId, 
                probability, 
                strategy.recommendation, 
                strategy.action
            ]);

            console.log(`🤖 AI Agent created recovery case #${result.insertId} for ${eventType}`);
            return result.insertId;

        } catch (error) {
            console.error("AI Recovery Agent Error:", error);
        }
    }
}

module.exports = new AIRecoveryAgent();
