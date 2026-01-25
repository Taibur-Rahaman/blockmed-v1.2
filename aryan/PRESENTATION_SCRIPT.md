# NeoBit CRM Architecture - Presentation Script (3-4 Minutes)

**GitHub Source:** [Multi-Tenant-CRM-System/ARCHITECTURE_DIAGRAMS.md](https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System/blob/main/ARCHITECTURE_DIAGRAMS.md)

---

## OPENING (15 seconds)

> "Hi everyone. I'll walk you through the architecture of NeoBit — a multi-tenant CRM system. We have four diagrams on our GitHub page covering system design, database model, workflows, and security. Let's dive in."

---

## DIAGRAM 1: System Architecture (50 seconds)

> "Starting with the System Architecture flowchart.

> **At the top, we have three client entry points:**
> - A React web app on port 3000
> - A native Android application
> - And Telegram users who interact through our bot

> **All traffic flows through Nginx** — our reverse proxy handling SSL termination with TLS 1.3 and rate limiting. Nginx routes requests based on URL path: `/api` goes to our backend, root serves the React app, and `/webhook` routes to the Telegram bot service.

> **We have four application services:**
> - **Spring Boot API** on port 8080 — the core REST and WebSocket server
> - **Telegram Bot Service** on port 8081 for handling customer messages
> - **Integration Worker** for background sync jobs with Gmail, Calendar, and ClickUp
> - **AI Service** using FastAPI for OpenAI integration — GPT-4 and Whisper

> **The data layer consists of:**
> - PostgreSQL 15 as our multi-tenant database
> - Redis 7 for caching and sessions
> - Elasticsearch 8 for full-text search

> **On the right**, we integrate with six external services: Google for OAuth and email, GitHub for authentication, ZegoCloud for WebRTC calls, ClickUp for tasks, Telegram Bot API, and OpenAI for AI features."

---

## DIAGRAM 2: Multi-Tenant Data Model (45 seconds)

> "The ERD shows our database schema with multi-tenant isolation.

> **The key design pattern:** Every table has a `tenant_id` foreign key. This enables shared-schema multi-tenancy — all tenants share the same tables, but data is isolated through this tenant ID.

> **The core entities are:**
> - **TENANT** — stores organization info, subscription plan, and JSON settings
> - **USER** — linked to a tenant with role-based access: Platform Admin, Vendor Admin, or Agent
> - **CUSTOMER** — CRM contacts with custom metadata fields stored as JSONB
> - **INTERACTION** — tracks all customer touchpoints: emails, calls, meetings, and Telegram messages

> **Supporting entities handle integrations:**
> - Integration configs store encrypted OAuth credentials
> - Telegram chats map chat IDs to customers
> - Tasks sync with ClickUp
> - Call sessions track voice and video calls
> - Transcriptions store AI-processed speech-to-text

> **Isolation is enforced at two levels:** Hibernate filters automatically add `WHERE tenant_id = ?` to queries, and PostgreSQL Row-Level Security provides database-level protection."

---

## DIAGRAM 3: Workflow Sequence (50 seconds)

> "The sequence diagram shows four critical workflows.

> **First, OAuth Authentication:**
> - User clicks login, gets redirected to Google's consent screen
> - After approval, Google sends an authorization code back
> - Backend exchanges this code for tokens and user info
> - We create or find the user, generate a JWT access token valid for 15 minutes, and a refresh token valid for 7 days stored in Redis

> **Second, Multi-Tenant Data Access:**
> - Every API request includes the JWT in the Authorization header
> - Backend validates the token, extracts the tenant ID, and sets it in a ThreadLocal context
> - All database queries automatically filter by this tenant ID
> - Users only see their organization's data

> **Third, Telegram Messages:**
> - When a customer messages our bot, Telegram sends a webhook
> - We validate it, find the customer, create an interaction record, and optionally send an auto-reply
> - Connected agents get real-time notifications via WebSocket

> **Fourth, Token Refresh:**
> - When access tokens expire, the frontend automatically uses the refresh token to get new credentials — users never notice the refresh happening."

---

## DIAGRAM 4: Security & Performance (45 seconds)

> "The final diagram shows our security layers and performance optimizations.

> **Six security layers work sequentially:**
> 1. SSL/TLS termination at Nginx
> 2. Rate limiting — 100 requests per minute per user
> 3. JWT validation in Spring Security
> 4. Tenant isolation via Hibernate filters and PostgreSQL RLS
> 5. AES-256 encryption for sensitive data like OAuth tokens
> 6. Role-based access control with three permission tiers

> **Performance optimizations include:**
> - Redis caching for sessions and API responses
> - Database indexes on all tenant_id columns plus composite indexes
> - HikariCP connection pooling with max 20 connections
> - Async background workers for email sync and AI processing
> - CDN for static React assets

> **For monitoring**, we use Spring Actuator health checks, audit logging for all data changes, and metrics tracking for latency and error rates.

> **Data protection** includes daily backups with point-in-time recovery, Row-Level Security as defense-in-depth, and encryption at rest."

---

## CLOSING (15 seconds)

> "In summary: NeoBit uses a microservices architecture with shared-schema multi-tenancy, OAuth2 authentication, defense-in-depth security, and performance optimizations achieving sub-100ms response times. The full documentation and source code are available on our GitHub. Thank you — happy to take questions."

---

## Timing Summary

| Section | Duration | Approx. Words |
|---------|----------|---------------|
| Opening | 15 sec | ~35 words |
| Diagram 1: System Architecture | 50 sec | ~180 words |
| Diagram 2: Data Model | 45 sec | ~160 words |
| Diagram 3: Workflows | 50 sec | ~185 words |
| Diagram 4: Security & Performance | 45 sec | ~170 words |
| Closing | 15 sec | ~45 words |
| **Total** | **~3.5 min** | **~775 words** |

---

## Delivery Tips

1. **Pace:** Speak at ~150 words/minute — slightly slower than conversational
2. **Transitions:** Brief pause between diagrams as you switch slides
3. **Pointing:** Use cursor/pointer to trace data flows in each diagram
4. **Emphasis:** Stress key terms: "tenant_id", "JWT", "15 minutes", "AES-256"
5. **Eye contact:** Look at audience, not slides, especially during closing

---

## Key Technical Terms to Remember

| Term | Definition |
|------|------------|
| **Multi-tenancy** | Single app instance serving multiple organizations with isolated data |
| **tenant_id** | Foreign key on every table enabling data isolation |
| **JWT** | JSON Web Token for stateless authentication (15-min TTL) |
| **Refresh Token** | Long-lived token (7-day TTL) stored in Redis |
| **RLS** | PostgreSQL Row-Level Security for database-level isolation |
| **Hibernate Filter** | Auto-appends `WHERE tenant_id = ?` to all queries |
| **OAuth2** | Industry-standard authorization framework (Google, GitHub) |
| **WebSocket** | Real-time bidirectional communication for notifications |
| **AES-256** | Advanced Encryption Standard for sensitive data |
| **HikariCP** | High-performance JDBC connection pool |

---

## Quick Q&A Answers

**Q: Why shared-schema instead of separate databases per tenant?**
> "Shared schema simplifies maintenance, deployments, and reduces infrastructure costs. Isolation is enforced at application and database levels through tenant_id filtering and RLS."

**Q: Why 15-minute access tokens?**
> "Short-lived tokens limit the damage if a token is compromised. Automatic refresh via 7-day refresh tokens keeps the user experience seamless."

**Q: How do you prevent cross-tenant data access?**
> "Two layers: Hibernate filters at the application level, and PostgreSQL Row-Level Security at the database level. Even if application code has bugs, the database prevents cross-tenant queries."

**Q: Why Redis for sessions instead of database?**
> "Redis provides sub-millisecond reads, reducing latency. It also supports automatic expiration (TTL) and pub/sub for real-time notifications."

**Q: How does the Telegram integration work?**
> "Each tenant gets a unique webhook URL. When customers message the bot, Telegram sends a webhook to our backend, we validate it, log the interaction, and optionally auto-reply."

---

**Document Version:** 1.0  
**Created:** December 2024  
**Source:** [GitHub Repository](https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System/blob/main/ARCHITECTURE_DIAGRAMS.md)

