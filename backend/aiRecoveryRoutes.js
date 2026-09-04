const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get AI Recovery Cases
    router.get('/cases', async (req, res) => {
        try {
            const [cases] = await db.query(`
                SELECT c.*, u.name as user_name, u.email as user_email 
                FROM ai_recovery_cases c
                JOIN users u ON c.user_id = u.id
                ORDER BY c.created_at DESC
            `);
            res.json({ success: true, cases });
        } catch (error) {
            console.error("Error fetching cases:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Overview Stats
    router.get('/overview', async (req, res) => {
        try {
            const [total] = await db.query('SELECT COUNT(*) as count FROM ai_recovery_cases');
            const [recovered] = await db.query('SELECT COUNT(*) as count FROM ai_recovery_cases WHERE status = "recovered"');
            
            res.json({ 
                success: true, 
                stats: {
                    total: total[0].count,
                    recovered: recovered[0].count,
                    recoveryRate: total[0].count > 0 ? (recovered[0].count / total[0].count) * 100 : 0
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Approve/Reject Recovery Case (Human-in-the-loop)
    router.post('/cases/:id/action', async (req, res) => {
        const { action } = req.body; // 'approve', 'reject'
        try {
            if (action === 'approve') {
                // For demo, we just mark it recovered to show success
                await db.query('UPDATE ai_recovery_cases SET status = "recovered" WHERE id = ?', [req.params.id]);
                // In a real scenario, this would trigger email sending
            } else {
                await db.query('UPDATE ai_recovery_cases SET status = "rejected" WHERE id = ?', [req.params.id]);
            }
            res.json({ success: true, message: `Case ${action}d` });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    return router;
};
