**Product Overview** A responsive web application composed of two flows: a gamified mobile interface (2-minute challenge) and a desktop interface (live dashboard/ranking for the booth screen).

**Functional Requirements (FR)**

* **FR01 \- Onboarding (Mobile):** The user scans the QR Code, enters the landing page, inputs their name (mandatory), and clicks "Start Challenge".  
* **FR02 \- Challenge Timer (Mobile):** A visible 2-minute countdown timer that starts immediately after clicking "Start". Once it reaches zero, it ends the session and submits the data.  
* **FR03 \- Store Simulation (Mobile):** An immersive Motorola e-commerce interface with products, filters, cart, and checkout containing intentional bugs (e.g., negative price, misaligned button, cart loop, broken text, filter that clears the screen).  
* **FR04 \- Bug Capture (Mobile):** Buggy elements contain an interactive layer (or floating "Report Bug" button/bubble) when clicked.  
* **FR05 \- Bug Reporting Modal (Mobile):** Clicking to report opens a simple modal with two fields: *Bug Title* and *Bug Description*, plus a "Send Report" button.  
* **FR06 \- Points Count:** Each unique bug reported correctly adds 1 point to the session profile.  
* **FR07 \- Real-Time Ranking (Desktop):** A dedicated screen for continuous display at the booth, updated in real time (via WebSocket or polling), showing the Top 10 with Name and Number of Bugs Found.

**Non-Functional Requirements (NFR)**

* **NFR01 \- Responsiveness:** Player interface 100% optimized for mobile screens (iOS/Android). Ranking interface optimized for Full HD (1080p) on large screens.  
* **NFR02 \- Performance:** Low latency in sending reports so as not to consume precious time from the 2-minute countdown timer.  
* **NFR03 \- Basic Anti-Spam:** The same buggy element can only be reported once per user during the match.

**Screen Architecture & User Flow**

1. **\[Mobile\] Screen 1 \- Registration:** `Input: Name` \-\> `Button: Start`  
2. **\[Mobile\] Screen 2 \- Store (Game):** Fixed header with `Timer: 02:00` and `Bugs Found: X`. Body with the Fake Store.  
3. **\[Mobile\] Modal \- Report:** `Input: Title` \+ `Textarea: Description` \-\> `Button: Confirm`  
4. **\[Mobile\] Screen 3 \- Game Over:** Score summary and thank you message.  
5. **\[Desktop\] Booth Dashboard:** Visually appealing table with the Top 10 updated live.

For a single-event project (where the focus is **development speed, zero infrastructure cost, and real-time synchronization**), the best strategy is to use a **Serverless stack with BaaS (Backend-as-a-Service)**.

Here is the ideal recommendation:

**Recommended Stack**

* **Frontend:** **React \+ Vite \+ Tailwind CSS**  
  * *Why:* Vite starts up in seconds and Tailwind allows styling the mobile store and desktop dashboard extremely quickly.  
* **Backend and Database:** **Supabase** (or Firebase)  
  * *Why:* It delivers a PostgreSQL database, ready-to-use API, and, most importantly, **native Realtime**. When the player finishes the challenge on their phone, the TV Ranking updates by itself in the same second without needing to reload the page.  
* **Hosting:** **Vercel** or **Netlify**  
  * *Why:* Free 1-click deploy integrated with GitHub, with automatic HTTPS (essential for scanning QR Codes without browser blocks).
