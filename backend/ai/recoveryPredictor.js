class RecoveryPredictor {
    calculateProbability(customerFeatures, cartTotal) {
        if (!customerFeatures) return 50; // default medium probability

        let score = 50;

        // Increase score for high LTV / loyal customers
        if (customerFeatures.totalOrders > 5) score += 20;
        else if (customerFeatures.totalOrders > 1) score += 10;

        // Decrease score if they abandon often
        if (customerFeatures.abandonedCartHistory > 3) score -= 15;

        // Adjust based on cart value vs LTV
        if (customerFeatures.lifetimeValue > 0 && cartTotal > (customerFeatures.lifetimeValue / customerFeatures.totalOrders) * 2) {
            // Unusually large cart for them, might just be window shopping
            score -= 10;
        }

        // Bound between 0 and 100
        return Math.max(0, Math.min(100, score));
    }
}

module.exports = new RecoveryPredictor();
