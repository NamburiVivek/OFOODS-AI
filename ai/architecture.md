# OFoods AI Revenue Recovery Architecture

## Overview
This document outlines the architecture for the AI-driven revenue recovery pipeline in OFoods.

## Components
1. **Drop-off Interceptors**: Listeners on Razorpay hooks and cart activity that detect payment failures or cart abandonments.
2. **Customer Analyzer**: Extracts LTV, total orders, and abandonment frequency to provide context.
3. **Recovery Predictor**: Deterministic model predicting the baseline probability (0-100) of recovering the cart.
4. **LLM Strategy Generator**: Uses Gemini to decide the best recovery action (e.g., standard reminder, 10% discount, free delivery).
5. **Admin AI Dashboard**: Interface for admins to review AI suggestions (Human-in-the-loop).
6. **Customer AI Assistant**: Widget for on-site product discovery based on user intent and budget.

## Data Flow
Event -> Analysis -> Prediction -> LLM Recommendation -> Dashboard -> Action Execution
