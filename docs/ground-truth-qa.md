# Shoplite Ground Truth Q&A with RAG Context

## Simple Factual Questions (8 questions - 40%)

### Q01: How long does it take for seller account verification to complete?
**Expected retrieval context:** Document 8: Shoplite Seller Account Setup and Management
**Authoritative answer:** Seller account verification typically takes 2-3 business days. During this time, the verification team reviews submitted documents including business licenses, tax registration certificates, and government-issued ID to ensure compliance with legal requirements and platform policies. Some sellers may be asked to provide additional documentation during this process.
**Required keywords in LLM response:** ["2-3 business days", "verification", "documents", "business"]
**Forbidden content:** ["instant approval", "same day", "no verification", "automatic approval"]

---

### Q02: What are the shipping timeframes for standard delivery on Shoplite?
**Expected retrieval context:** Document 5: Shoplite Order Tracking and Delivery
**Authoritative answer:** Standard shipping on Shoplite typically takes 5-7 business days for delivery. Additionally, expedited shipping takes 2-3 business days, and express overnight shipping delivers within 1 business day for orders placed before 2 PM. International orders have extended delivery windows of 10-21 business days depending on destination country and customs processing.
**Required keywords in LLM response:** ["5-7 business days", "standard shipping", "delivery"]
**Forbidden content:** ["overnight", "same day", "1-2 days" for standard shipping]

---

### Q03: What is the minimum password requirement for creating a Shoplite account?
**Expected retrieval context:** Document 1: Shoplite User Registration Process
**Authoritative answer:** Shoplite requires passwords to be a minimum of 8 characters and must include uppercase letters, lowercase letters, numbers and special character. This ensures account security for all users during the registration process.
**Required keywords in LLM response:** ["8 characters", "uppercase", "lowercase", "numbers","special character"]
**Forbidden content:** ["no requirements", "any password", "6 characters"]

---

### Q04: What commission rate do Basic tier sellers pay on Shoplite?
**Expected retrieval context:** Document 10: Shoplite Commission and Fee Structure
**Authoritative answer:** Basic tier sellers pay a flat 12% commission on each sale plus a $0.30 transaction fee per order. Professional tier sellers who pay the $39.99 monthly subscription benefit from reduced commission rates of 8% plus the same $0.30 transaction fee.
**Required keywords in LLM response:** ["12%", "commission", "Basic tier", "$0.30", "transaction fee"]
**Forbidden content:** ["8%", "free", "no commission"]

---

### Q05: How many images are required minimum for a product listing?
**Expected retrieval context:** Document 17: Shoplite Product Listing Best Practices
**Authoritative answer:** Product listings require a minimum of 3 images, but 7-10 images are optimal for better conversion rates. The primary image should show the product on a white background, and additional images should display multiple angles, close-up details, scale references, products in use, and packaging contents. Images must be high-resolution with minimum 1000x1000 pixels.
**Required keywords in LLM response:** ["3 images", "minimum", "high-resolution", "1000x1000 pixels"]
**Forbidden content:** ["1 image", "no images required", "500x500"]

---

### Q06: What is the Order Defect Rate (ODR) threshold that sellers must maintain?
**Expected retrieval context:** Document 16: Shoplite Seller Performance Metrics and Requirements
**Authoritative answer:** Sellers must maintain an Order Defect Rate (ODR) below 1%, meaning fewer than 1 in 100 orders can result in negative customer experiences including product not received claims, significantly not as described claims, and credit card chargebacks. High ODR indicates systemic problems and can result in account warnings, selling restrictions, or permanent suspension.
**Required keywords in LLM response:** ["1%", "ODR", "Order Defect Rate", "below"]
**Forbidden content:** ["5%", "10%", "no limit", "flexible"]

---

### Q07: How long do customers have to complete email verification after registration?
**Expected retrieval context:** Document 1: Shoplite User Registration Process
**Authoritative answer:** Email verification must be completed within 24 hours of registration to activate the account. This is mandatory for all users during the registration process at shoplite.com/register.
**Required keywords in LLM response:** ["24 hours", "email verification", "mandatory"]
**Forbidden content:** ["optional", "no time limit", "7 days", "instant"]

---

### Q08: What is the rate limit for standard API accounts per hour?
**Expected retrieval context:** Document 13: Shoplite API Documentation for Developers
**Authoritative answer:** Standard API accounts are allowed 1000 requests per hour, while premium accounts can make 5000 requests per hour. Exceeding rate limits results in temporary throttling with clear error messages indicating wait times. The API uses OAuth 2.0 protocol for authentication.
**Required keywords in LLM response:** ["1000 requests", "per hour", "standard", "rate limit"]
**Forbidden content:** ["unlimited", "5000" for standard accounts, "no limits"]

---

## Complex Multi-Document Questions (12 questions - 60%)

### Q09: I want to start selling on Shoplite. What's the complete process from registration to being able to list products, and what fees should I expect?
**Expected retrieval context:** Document 8: Shoplite Seller Account Setup and Management + Document 10: Shoplite Commission and Fee Structure
**Authoritative answer:** To become a Shoplite seller, first create a basic account, then navigate to Seller Central to begin the business application. You'll need to provide business information including legal business name, tax identification number (EIN or SSN for sole proprietors), business address, and bank account details. Submit documents like business licenses, tax registration certificates, and government-issued ID. Verification takes 2-3 business days. Once approved, you can access the Seller Dashboard to create product listings. For fees, Basic tier is free but charges 12% commission plus $0.30 per transaction. Professional tier costs $39.99 monthly with reduced 8% commission. Category-specific commissions may apply - electronics are 10%, books/media are 6%, and handmade products are 7%.
**Required keywords in LLM response:** ["Seller Central", "business verification", "2-3 business days", "12% commission", "Basic tier", "Professional tier", "$39.99"]
**Forbidden content:** ["instant approval", "no fees", "free selling"]

---

### Q10: If I receive a damaged product, what are my options for returns and how long will it take to get my money back?
**Expected retrieval context:** Document 6: Shoplite Return and Refund Policies + Document 5: Shoplite Order Tracking and Delivery
**Authoritative answer:** For damaged products, log into your account, go to "My Orders," select the order, and click "Request Return." You'll select the damage reason and upload photos of the damage. Return requests are reviewed within 24-48 hours. Since the item is damaged, Shoplite covers return shipping costs and you'll receive a prepaid return shipping label via email. Items must be shipped back within 14 days of return approval. Once the returned item is received and inspected at the facility, refunds are processed within 5-7 business days and credited to your original payment method. The total timeline from initiating return to receiving refund is approximately 2-3 weeks depending on shipping time.
**Required keywords in LLM response:** ["Request Return", "24-48 hours", "prepaid label", "Shoplite covers", "5-7 business days", "photos"]
**Forbidden content:** ["immediate refund", "no return needed", "keep the item"]

---

### Q11: How can I track my order and what notifications will I receive during the shipping process?
**Expected retrieval context:** Document 5: Shoplite Order Tracking and Delivery + Document 12: Shoplite Mobile App Features
**Authoritative answer:** After placing an order, you'll receive immediate email confirmation with a unique order number and estimated delivery timeframe. You can track orders through the "My Orders" section in your account dashboard or by entering your order number on the tracking page. The system displays real-time updates including order confirmation, payment processing, seller preparation, shipment dispatch, in-transit status, out for delivery, and final delivery confirmation with timestamps and location information. You'll receive automatic email and SMS notifications (if enabled) at key milestones such as shipment dispatch and delivery. If using the mobile app, push notifications keep you informed about order updates and delivery status changes, and you can customize notification preferences to receive only relevant alerts.
**Required keywords in LLM response:** ["My Orders", "real-time updates", "email", "SMS notifications", "order number", "tracking page"]
**Forbidden content:** ["no tracking", "manual check only", "call seller"]

---

### Q12: What security measures does Shoplite have in place to protect my payment information and personal data?
**Expected retrieval context:** Document 4: Shoplite Payment Methods and Security + Document 14: Shoplite Security and Privacy Policies
**Authoritative answer:** Shoplite implements comprehensive security measures including 256-bit SSL/TLS encryption for all data transmissions, ensuring information remains secure during transfer. Payment transactions use 256-bit SSL encryption and Shoplite never stores complete credit card numbers, instead using tokenization systems that replace card details with secure tokens. Payment processing partners maintain PCI DSS compliance and highest security certifications. The infrastructure includes multiple security layers with firewalls, intrusion detection systems, and regular third-party security audits. User data is stored in secure, geographically distributed data centers with redundant backups. Access to customer data is strictly limited to authorized personnel with all access logged and monitored. Two-factor authentication is available for enhanced account security, and fraud detection systems monitor transactions for suspicious activity patterns.
**Required keywords in LLM response:** ["256-bit SSL encryption", "tokenization", "PCI DSS", "two-factor authentication", "fraud detection", "secure data centers"]
**Forbidden content:** ["no encryption", "stores credit cards", "unsecure"]

---

### Q13: I'm having issues with my order. What are all the ways I can get help, and how quickly will someone respond?
**Expected retrieval context:** Document 11: Shoplite Customer Support Procedures + Document 12: Shoplite Mobile App Features
**Authoritative answer:** Shoplite offers multiple support channels. You can use live chat available 9 AM - 9 PM EST, email support with 24/7 availability responding within 24 hours, phone support for urgent issues, or the comprehensive help center with over 500 articles. The help center has a search function and includes step-by-step instructions with screenshots and video tutorials. For faster service, log into your account before contacting support so agents can immediately view your order history. Provide your order number, detailed issue description, and relevant screenshots. Critical issues like payment failures or account security receive immediate attention (2-4 hours), standard order inquiries are addressed within 24 hours, and general questions may take up to 48 hours during peak periods. If using the mobile app, you can access support directly and receive push notifications when your support tickets are updated or resolved.
**Required keywords in LLM response:** ["live chat", "9 AM - 9 PM EST", "email support", "24 hours", "help center", "phone support", "order number"]
**Forbidden content:** ["no support available", "weeks to respond", "email only"]

---

### Q14: What's the difference between the shopping cart and "Save for Later" feature, and how long are items stored?
**Expected retrieval context:** Document 2: Shoplite Shopping Cart Features + Document 1: Shoplite User Registration Process
**Authoritative answer:** The shopping cart holds items you're ready to purchase, displaying seller name, product image, price, quantity, and variants. Cart contents are preserved across sessions for logged-in users, meaning items remain even after closing the browser or switching devices. The "Save for Later" feature allows you to move items out of the active cart without deleting them - useful for comparing options or waiting for sales. Saved items appear in a separate section and can be moved back to the cart with one click. For guest users, cart selections are stored temporarily using browser cookies and will be lost after 7 days of inactivity or when cookies are cleared. Logged-in users maintain their cart and saved items indefinitely as they're stored in the account, not browser cookies.
**Required keywords in LLM response:** ["Save for Later", "cart", "logged-in users", "preserved", "guest users", "7 days", "browser cookies"]
**Forbidden content:** ["same thing", "no difference", "24 hours only"]

---

### Q15: How do product reviews work, and how can I tell if a review is from a real buyer?
**Expected retrieval context:** Document 7: Shoplite Product Reviews and Ratings + Document 17: Shoplite Product Listing Best Practices
**Authoritative answer:** Only verified buyers who have purchased and received a product can submit reviews, ensuring authenticity. The review window opens 3 days after delivery and remains available for 90 days post-purchase. Reviews include a 1-5 star rating and optional written feedback, plus up to 5 photos or videos showing the product in use. All reviews undergo 24-48 hour moderation to ensure they meet community guidelines, rejecting reviews with profanity or unrelated content. Verified purchase badges appear next to reviews from confirmed buyers, adding credibility. The system calculates overall product ratings by averaging all star ratings. Reviews can be sorted by helpfulness (based on user votes), most recent, or highest/lowest ratings. Top reviewers who consistently provide helpful reviews earn special badges, and their reviews get higher visibility. The system flags potentially biased reviews from accounts with suspicious patterns.
**Required keywords in LLM response:** ["verified buyers", "Verified purchase badges", "3 days after delivery", "90 days", "moderation", "1-5 stars"]
**Forbidden content:** ["anyone can review", "instant posting", "no verification"]

---

### Q16: I want to offer a discount on my products. How do promotional codes work for sellers, and what types can I create?
**Expected retrieval context:** Document 15: Shoplite Promotional Codes and Discounts + Document 8: Shoplite Seller Account Setup and Management
**Authoritative answer:** Sellers can create custom promotional codes for their products through the Seller Dashboard, setting discount percentages, usage limits, and validity periods. Several code types are available: percentage discounts (e.g., 20% off), fixed amount discounts (specific dollar reductions like $10 off), free shipping codes that waive shipping charges, and BOGO (buy-one-get-one) promotions. You can set usage restrictions including minimum purchase requirements, maximum discount caps, single-use vs. multiple-use codes, expiration dates, and new customer eligibility. Codes are alphanumeric strings that customers enter during checkout, and the system validates them in real-time. Customers discover codes through email, social media, the app's "Deals" section, or third-party coupon websites. The system generally prohibits stacking multiple codes, applying whichever provides greater savings.
**Required keywords in LLM response:** ["Seller Dashboard", "percentage discounts", "fixed amount", "free shipping", "usage limits", "validity periods", "minimum purchase"]
**Forbidden content:** ["automatic discounts only", "cannot create codes", "Shoplite creates all codes"]

---

### Q17: What happens if I have a dispute with a seller, and what evidence should I provide?
**Expected retrieval context:** Document 18: Shoplite Dispute Resolution and Buyer Protection + Document 11: Shoplite Customer Support Procedures
**Authoritative answer:** If you have issues with an order, first attempt resolution directly with the seller through Shoplite's messaging system. If the seller is unresponsive for 48 hours or communication fails, escalate to formal dispute resolution. Access "My Orders," select the problematic order, and click "Open Dispute." Provide dispute details, select the reason (items not received, items different from description, defective/damaged products, or unauthorized transactions), and upload supporting evidence like photos, videos, or communication records. Comprehensive evidence strengthens your case significantly. The seller has 3 business days to respond with their perspective. Shoplite's dispute resolution team reviews all information objectively within 5-7 business days for standard cases. Possible resolutions include full refunds, partial refunds, return requirements, or dispute denial if evidence supports the seller. Buyer Protection guarantees cover eligible purchases up to $2,500 per transaction, ensuring refunds if items don't arrive or don't match descriptions.
**Required keywords in LLM response:** ["48 hours", "Open Dispute", "photos", "videos", "evidence", "3 business days", "5-7 business days", "Buyer Protection", "$2,500"]
**Forbidden content:** ["instant resolution", "automatic refund", "no evidence needed"]

---

### Q18: As a new seller, what performance standards do I need to maintain to avoid account issues?
**Expected retrieval context:** Document 16: Shoplite Seller Performance Metrics and Requirements + Document 8: Shoplite Seller Account Setup and Management
**Authoritative answer:** Sellers must maintain several key metrics to remain in good standing. Order Defect Rate (ODR) must stay below 1% - meaning fewer than 1 in 100 orders can have issues like not received claims or chargebacks. Pre-fulfillment cancel rate must be below 2.5%, and late shipment rate should remain under 4% with orders shipped within promised handling time. Valid tracking rate requires at least 95% of orders to have working tracking numbers. Response time to customer messages must average under 24 hours, and customer satisfaction rating should maintain 4.0 stars or higher. Performance reviews occur monthly, and underperforming sellers receive notifications with 30 days to improve before escalating consequences. Maintaining these standards ensures continued access to the platform. High performers may qualify for benefits like reduced commission rates, featured seller badges, and priority support. Consistent violations can result in account suspension or termination.
**Required keywords in LLM response:** ["1%", "ODR", "2.5%", "4%", "95%", "24 hours", "4.0 stars", "monthly reviews"]
**Forbidden content:** ["no requirements", "flexible standards", "warnings only"]

---

### Q19: I want to use Shoplite's API to integrate with my inventory system. What do I need to get started and what can I do with it?
**Expected retrieval context:** Document 13: Shoplite API Documentation for Developers + Document 9: Shoplite Inventory Management for Sellers
**Authoritative answer:** To use Shoplite's API, register through the Developer Portal to obtain API credentials including an API key and secret. The RESTful API uses standard HTTP methods (GET, POST, PUT, DELETE) with JSON responses and OAuth 2.0 authentication. Rate limits allow 1000 requests per hour for standard accounts and 5000 for premium accounts. Key endpoints include product listing management (create, update, delete listings), inventory management for real-time stock updates, order processing to retrieve order details and update status, customer management with proper permissions, and webhook subscriptions for real-time event notifications like new orders or inventory changes. The inventory management integration allows you to track stock levels, set low-stock alerts, and automate inventory updates across multiple sales channels. The API documentation portal provides interactive testing tools and sandbox environment for testing without affecting production data. Support is available through dedicated forums, email, and monthly webinars.
**Required keywords in LLM response:** ["Developer Portal", "API key", "OAuth 2.0", "1000 requests", "REST", "inventory management", "real-time", "webhook"]
**Forbidden content:** ["no authentication", "unlimited requests", "automatic access"]

---

### Q20: What are all the features available in the Shoplite mobile app that I can't get on the website?
**Expected retrieval context:** Document 12: Shoplite Mobile App Features + Document 2: Shoplite Shopping Cart Features + Document 5: Shoplite Order Tracking and Delivery
**Authoritative answer:** The Shoplite mobile app offers several exclusive features beyond the website. Voice search allows speaking product queries instead of typing, and barcode scanning lets you scan physical product barcodes to find matching items for price comparisons. Push notifications keep you informed about order updates, delivery status changes, price drops on watched items, and exclusive mobile app deals (customizable in preferences). Biometric authentication (fingerprint or face recognition) enables quick, secure login without entering passwords. Mobile-exclusive features include augmented reality product preview for furniture and home decor items to visualize products in your space using the device camera, and one-touch checkout that streamlines purchases using stored payment and shipping information. The app offers offline mode for browsing previously viewed products and saved items without internet connection, and location-based features show nearby seller locations and estimated delivery times based on your GPS position. The wishlist syncs across devices, and you can share products directly to social media platforms.
**Required keywords in LLM response:** ["voice search", "barcode scanning", "push notifications", "biometric authentication", "augmented reality", "one-touch checkout", "offline mode", "location-based"]
**Forbidden content:** ["no different features", "same as website", "nothing special"]