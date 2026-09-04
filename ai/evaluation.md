# Evaluation Methodology

## Scenarios Tested
- **High LTV Customer fails payment**: AI should recommend personalized outreach.
- **New Customer abandons cart**: AI recommends standard 10% discount.
- **Window Shopper abandons high value cart**: AI recommends standard reminder to preserve margins.

## Fallback Mechanisms
- If LLM provider is down, the system gracefully falls back to deterministic rules (e.g., `send_email_reminder`).
- If email transport fails, the system logs the attempt but does not crash.
