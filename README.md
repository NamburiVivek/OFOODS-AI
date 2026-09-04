OFOODS AI — Agentic Commerce Assistant

AI-powered agentic commerce platform for intelligent food discovery, personalized recommendations, cart assistance, and AI-driven revenue recovery.

OFOODS AI extends the OFOODS e-commerce platform with an AI layer that helps customers move from intent → product discovery → cart → checkout, while also helping the business recover revenue from payment failures and abandoned carts.

Built for the Razorpay Buildathon — Track 1: AI Growth & Agentic Commerce.

🚀 What is OFOODS AI?

Traditional e-commerce makes customers navigate menus, search products, compare options, manage their cart, and complete checkout manually.

OFOODS AI changes this into a conversational commerce experience.

A customer can simply ask things like:

"What should I order?"

"Show me something under ₹500"

"I want something spicy"

"Find products similar to this"

"Add this to my cart"

"What's in my cart?"

"How do I checkout?"

"How does Razorpay payment work?"

The AI understands the customer's intent, uses the OFOODS product catalog and customer context, and responds with relevant products or actions.

At the business side, the AI recovery pipeline identifies payment failures and abandoned carts, evaluates the customer and cart context, predicts recovery probability, and generates a recovery strategy for admin review.

🎯 Problem

Online food shopping often requires customers to:

Browse multiple categories

Search manually for products

Compare products

Decide what fits their budget

Add products to the cart

Complete checkout

Resolve payment or delivery questions

At the same time, businesses lose potential revenue when customers abandon carts or payments fail.

OFOODS AI addresses both sides:

Customer side

Intent → AI understanding → Product discovery → Recommendation → Cart action → Checkout

Business side

Payment/cart drop-off → Customer analysis → Recovery prediction → AI strategy → Human approval → Recovery action

✨ Key Features

🤖 AI Shopping Assistant

A conversational AI assistant integrated into the OFOODS website.

It supports:

Product search

Product discovery

Budget-based recommendations

Category recommendations

Similar-product recommendations

Product comparisons

Popular products

Vegetarian products

Sweet, spicy, and hot product discovery

Product information

Cart queries

Add/remove products from cart

Increase/decrease quantity

Cart total

Checkout assistance

Payment assistance

Delivery and pickup information

Order-related assistance

Account assistance

🧠 Intent-Aware AI

The assistant does not treat every message as a generic chatbot query.

It identifies the customer's intent and extracts useful information such as:

Budget

Product name

Category

Quantity

Product references

Current page

Cart context

Recent conversation history

This allows the system to connect natural-language requests with actual e-commerce actions.

🛒 AI + Real Cart Integration

The AI assistant is connected to the existing OFOODS cart mechanism.

For example:

Customer:
"Add tomato pickle to my cart"

        ↓

AI Intent Detection

        ↓

Product Catalog Matching

        ↓

Exact Product Resolution

        ↓

Cart Update

        ↓

Customer Confirmation

The assistant can also process requests such as:

"Remove it"
"Add 2 more"
"What's my cart total?"
"Clear my cart"

💰 Budget-Aware Recommendations

Customers can express a budget naturally:

"Give me snacks under ₹300"
"Best products under ₹500"
"I need something cheap and spicy"

The AI identifies the budget requirement and uses the product engine to return suitable products.

👤 Context-Aware Shopping

The AI can use:

Customer name

Current page

Current cart

Cart total

Recent conversation history

Previously displayed products

This makes recommendations more contextual instead of treating every query independently.

📦 AI Revenue Recovery

OFOODS AI also contains an AI-driven revenue recovery pipeline.

It can process drop-off events such as:

Payment failures

Abandoned carts

The recovery pipeline performs:

Drop-off Event
      ↓
Customer Analysis
      ↓
Recovery Probability
      ↓
AI Recovery Strategy
      ↓
Recovery Case
      ↓
Admin Review
      ↓
Action

📊 Customer Analysis

The recovery system analyzes customer context including:

Lifetime value

Total orders

Abandoned cart history

Cart value

Customer behavior

This information is used to generate a more appropriate recovery strategy.

📈 Recovery Prediction

A deterministic recovery predictor calculates a baseline recovery probability using customer and cart characteristics.

The system considers factors such as:

Previous abandoned carts

Customer lifetime value

Number of previous orders

Cart value relative to customer history

🧠 AI Recovery Strategy

Gemini is used to generate a recovery recommendation based on the customer and drop-off context.

Possible strategies include:

Standard reminder

Discount-based recovery

Free-delivery incentive

Personalized outreach

The system also includes deterministic fallback behavior if the AI provider is unavailable.

👨‍💼 Human-in-the-Loop AI Dashboard

AI-generated recovery cases are surfaced through an admin dashboard.

Admins can review the AI recommendation before taking action.

This keeps the system practical and controllable rather than allowing an AI agent to perform sensitive revenue actions without oversight.

💳 Razorpay Integration

Razorpay is integrated into the OFOODS checkout and payment flow.

The application includes:

Razorpay checkout

Payment order creation

Payment verification

Payment failure handling

AI recovery workflows around payment/cart drop-offs

This connects the AI experience directly to the commerce and payment lifecycle.

Razorpay's current agentic commerce direction focuses on moving commerce from traditional navigation toward experiences where customers can express intent, discover products, and complete transactions within the same journey. OFOODS AI is designed around this same intent-to-commerce concept.

🏗️ Architecture

                    ┌─────────────────────┐
                    │      Customer       │
                    │ Natural Language    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ OFOODS AI Assistant │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Intent Detection  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       Product Catalog    User Context      Knowledge Base
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Product / Action    │
                    │ Engine              │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                 Products             Cart Action
                    │                     │
                    └──────────┬──────────┘
                               ▼
                         OFOODS Store


              BUSINESS REVENUE RECOVERY FLOW

       Payment Failure / Cart Abandonment
                       │
                       ▼
              Customer Analyzer
                       │
                       ▼
             Recovery Predictor
                       │
                       ▼
              Gemini AI Strategy
                       │
                       ▼
              Recovery Case DB
                       │
                       ▼
               Admin AI Dashboard
                       │
                       ▼
                 Human Approval
                       │
                       ▼
                Recovery Action

🛠️ Technology Stack

Frontend

HTML5

CSS3

Vanilla JavaScript

Responsive mobile design

Backend

Node.js

Express.js

REST APIs

AI

Google Gemini

@google/genai

Intent detection

Product recommendation

Context-aware conversations

AI revenue recovery strategy generation

Database

MySQL

mysql2

Payments

Razorpay

Authentication

JWT

bcryptjs

Communication

Nodemailer

Email notifications

Deployment

Vercel

📁 Project Structure

OFOODS AI/
│
├── ai/
│   ├── architecture.md
│   └── evaluation.md
│
├── backend/
│   ├── ai/
│   │   ├── agent.js
│   │   ├── catalog.js
│   │   ├── customerAnalyzer.js
│   │   ├── dataset.json
│   │   ├── intentDetector.js
│   │   ├── llmService.js
│   │   ├── productEngine.js
│   │   ├── recoveryPredictor.js
│   │   ├── userContextService.js
│   │   └── knowledge/
│   │       ├── knowledgeLoader.js
│   │       ├── knowledgeRetriever.js
│   │       └── ofoodsKnowledge.json
│   │
│   ├── aiRecoveryRoutes.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── ai-assistant.js
│   ├── ai-dashboard.html
│   ├── ai-dashboard.js
│   ├── index.html
│   ├── menu.html
│   ├── cart.html
│   ├── Checkout.html
│   ├── login.html
│   ├── profile.html
│   └── ...
│
├── products-seed.json
├── vercel.json
├── robots.txt
├── sitemap.xml
└── README.md

⚙️ Local Setup

1. Clone the repository

git clone https://github.com/NamburiVivek/Ofoods26-Ecommerce.git
cd Ofoods26-Ecommerce

2. Install backend dependencies

cd backend
npm install

3. Configure environment variables

Create:

backend/.env

Use the following structure:

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

JWT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

GMAIL_USER=
GMAIL_APP_PASSWORD=

AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=

Do not commit .env or API/payment secrets to GitHub.

4. Start the backend

Development:

npm run dev

Production:

npm start

The application runs on:

http://localhost:3000

The Express server also serves the frontend, so the complete OFOODS application can be accessed through the same local server.

🔑 AI Configuration

The AI service uses Gemini through the Google GenAI SDK.

Configure:

AI_PROVIDER=gemini
AI_API_KEY=your_api_key
AI_MODEL=your_model

If the AI provider is unavailable, the system has fallback behavior for important recommendation and recovery flows.

🧪 AI Evaluation

The project includes an AI evaluation suite covering scenarios such as:

Budget extraction

Category recommendation

Product-engine budget constraints

Context requirements

The current evaluation suite in the project reports:

Passed: 4
Failed: 0

Additional recovery scenarios are documented in:

ai/evaluation.md

🔐 Security

The application includes:

Password hashing with bcryptjs

JWT authentication

Protected authenticated routes

Admin authentication

Environment-variable based secret management

Razorpay payment verification

Input validation

CORS configuration

.env excluded from Git through .gitignore

📱 E-Commerce Capabilities

OFOODS includes a complete online shopping workflow:

Registration and login

Product browsing

Category navigation

Product details

Search

Shopping cart

Checkout

Razorpay payments

Home delivery

Store pickup

Customer profiles

Saved addresses

Order history

Reviews and ratings

Admin order management

Shipment tracking

Email notifications

Responsive design

🌟 Why OFOODS AI Fits Agentic Commerce

OFOODS AI is not only a chatbot placed on top of an e-commerce website.

The AI is connected to the actual commerce workflow.

It can:

UNDERSTAND
    ↓
customer intent

DECIDE
    ↓
what products/actions are relevant

ACT
    ↓
recommend products / modify cart / guide checkout

RECOVER
    ↓
identify and respond to lost-commerce opportunities

This creates a more autonomous and intent-driven shopping experience.

🔮 Future Scope

Potential future improvements include:

Fully autonomous agentic checkout

Consent-based delegated payments

Voice-based shopping

Multilingual Indian-language shopping

Personalized offers based on customer behavior

Automated abandoned-cart recovery

AI-driven reorder predictions

Advanced customer lifetime-value modeling

More payment and commerce tools exposed to the AI agent

Real-time business analytics

🏆 Buildathon Submission

Project: OFOODS AI — Agentic Commerce Assistant

Track: AI Growth & Agentic Commerce

Repository:
https://github.com/NamburiVivek/Ofoods26-Ecommerce

Live Website:
https://www.ofoods.co.in

Buildathon:
https://razorpay.com/buildathon/

👨‍💻 Developer

Vivek Namburi

GitHub: https://github.com/NamburiVivek

OFOODS: https://www.ofoods.co.in

📄 License

This project is developed and maintained for OFOODS business operations.

All rights reserved.
