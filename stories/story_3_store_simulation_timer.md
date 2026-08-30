# Story 3: E-commerce Store Simulation & Challenge Timer (Mobile)

**Title:** Responsive Fake Store Layout with Challenge Countdown Timer

## Goal
Develop an immersive, simulated e-commerce environment featuring Motorola products and a prominent, high-stakes 2-minute countdown timer.

## Target Requirements Mapped
- **RF02 - Challenge Timer (Mobile):** Visible 2-minute countdown timer that triggers immediately and ends the session upon reaching zero.
- **RF03 - Store Simulation (Mobile):** Responsive fake Motorola store with products, filters, cart, and checkout including simulated/intentional bugs.
- **RNF01 - Responsiveness:** Mobile-friendly layouts for all e-commerce views.

## Tasks to be Completed
- [ ] Implement a fixed top header in the Mobile layout displaying:
  - `Timer: 02:00` (formatted MM:SS, ticking down by 1 second intervals).
  - `Bugs Found: X` (counter showing the current number of successfully reported bugs).
- [ ] Build a simulated Motorola e-commerce storefront:
  - Product Catalog (e.g., Razr, Edge, Moto G) with titles, images, and prices.
  - Category filters (e.g., "Premium", "Intermediates", "Accessories").
  - A functional "Add to Cart" system and a sliding Cart Drawer/Checkout sheet.
- [ ] Seed the interface with intentional, pre-coded bugs:
  - Bug A (Price): A specific phone displays a negative price (e.g., -$999.00).
  - Bug B (Layout): A CTA button is overlapping text or pushed off-screen.
  - Bug C (Loop): Clicking "Increase Quantity" in the cart resets the quantity to 0 or starts an infinite rendering/interaction loop.
  - Bug D (Text): Broken characters or raw HTML tags visible in a product description.
  - Bug E (Filter): Selecting a specific category filter clears the entire product catalog and shows a blank screen instead of a friendly message.
- [ ] Create timer end-of-session handling:
  - When the countdown reaches `00:00`, freeze the user interface.
  - Update the player's database record: set `session_ended = true`.
  - Redirect the player to the "Game Over" screen summarizing their performance.

## Acceptance Criteria
- [ ] The 2-minute countdown begins instantly upon entering the store and updates precisely every second.
- [ ] E-commerce flows (browsing products, filtering categories, adding items to cart, viewing cart) work seamlessly as a realistic mock storefront.
- [ ] Intentional bugs are visually reproducible and fully interactive.
- [ ] When the clock hits `00:00`, the game halts instantly, updates the database session, and forwards the player to the final summary screen.
