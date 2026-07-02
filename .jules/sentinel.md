## 2024-07-02 - Next.js Security Headers
**Vulnerability:** Missing security headers in a default Next.js application, which leaves it susceptible to various client-side attacks like clickjacking, MIME-sniffing, and certain types of XSS.
**Learning:** Default boilerplate Next.js setups do not enforce strict security headers out of the box, relying on developers to configure them explicitly in `next.config.ts`.
**Prevention:** Implement an asynchronous `headers()` configuration in `next.config.ts` enforcing strict security headers (e.g., CSP, X-Frame-Options, Strict-Transport-Security) for all routes as a standard practice for all new Next.js projects.
