const db = require('mysql2/promise');

class CustomerAnalyzer {
    async analyze(dbPool, userId) {
        try {
            // 1. Get total past orders & lifetime value
            const [orders] = await dbPool.query(
                `SELECT COUNT(id) as total_orders, SUM(total_amount) as ltv 
                 FROM orders WHERE user_id = ? AND status != 'cancelled'`,
                [userId]
            );

            // 2. Get past abandoned carts
            const [abandons] = await dbPool.query(
                `SELECT COUNT(id) as total_abandons 
                 FROM abandoned_carts WHERE user_id = ?`,
                [userId]
            );

            // 3. Get user profile
            const [users] = await dbPool.query(
                `SELECT name, email, created_at FROM users WHERE id = ?`,
                [userId]
            );

            const user = users[0] || {};
            const stats = orders[0] || { total_orders: 0, ltv: 0 };
            const abandonStats = abandons[0] || { total_abandons: 0 };

            return {
                name: user.name,
                email: user.email,
                accountAgeDays: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) || 0,
                totalOrders: stats.total_orders || 0,
                lifetimeValue: stats.ltv || 0,
                abandonedCartHistory: abandonStats.total_abandons || 0
            };
        } catch (error) {
            console.error("Customer Analysis Error:", error);
            return null;
        }
    }
}

module.exports = new CustomerAnalyzer();
