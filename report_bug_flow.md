# Gamified Mobile Bug Hunting: Bug Reporting UX & Dynamic Scoring System

This document outlines the refactored user experience (UX) and dynamic scoring mechanics for the **Cin Open Day Motorola Challenge**. It addresses key improvements to visual stealth, reporting realism, and gamified engagement.

---

## 🎯 Core Goals & Key Upgrades

1. **Visual Stealth ("Hide the Bugs"):** Remove all explicit visual cues (dashed borders, orange highlights, flashing dots, text labels) that reveal simulated bugs. The store must look like a high-fidelity, production-ready Motorola e-commerce platform.
2. **Real-Life QA Experience:** Replace auto-populated inputs in the Bug Report modal with blank, validated fields. Force players to write precise bug titles and descriptions, experiencing the true life of a QA Engineer.
3. **Advanced Dynamic Scoring (Pontuation):** Transition from a flat `+1 point` system to an multi-dimensional system featuring:
   * **Severity-Based Base Points:** Harder bugs yield higher base points.
   * **Semantic Quality Verification:** Bonus points for description depth and keyword matches.
   * **Time-Based Speed & Streak Combo Bonuses:** Extra points for rapid successive captures and fast solving.

---

## 🧭 The End-to-End User Flow

```
+--------------------+      +--------------------+      +--------------------+
|  1. Onboarding     |      |  2. Store Front    |      |  3. Bug Discovery  |
|  - Enter Name      | ---> |  - Invisible Bugs  | ---> |  - Interactive Tap |
|  - Start 2m Timer  |      |  - Normal Browsing |      |  - Game Suspended  |
+--------------------+      +--------------------+      +--------------------+
                                                                   |
                                                                   v
+--------------------+      +--------------------+      +--------------------+
|  6. Desktop Leader |      |  5. Score Sync     |      |  4. QA Reporting   |
|  - Realtime Sync   | <--- |  - Base + Quality  | <--- |  - Blank Title     |
|  - Top 10 Display  |      |  - Speed + Streak  |      |  - Blank Desc      |
+--------------------+      +--------------------+      +--------------------+
```

---

## 🥷 1. Visual Stealth Refactoring (Hiding the Bugs)

Currently, the e-commerce store provides obvious hints about where the bugs are (e.g., flashing circles, dashed red lines, and textual helper labels). To restore the "joy of discovery", we are implementing the following visual refactoring directives:

### Seeding Disguise Matrix

| Bug ID | Bug Name | Current Visible Implementation | Stealth Disguise Implementation (New UX) |
| :--- | :--- | :--- | :--- |
| **`bug_price`** | **Negative Price on Moto G Power** | Border dashed red, red background wrapper, text `-$999.00`, and a "Bug" label. | Styled identically to a normal price. Price shown as `-$999.00` in the exact same color (cyan-300) and sizing as valid prices, with **no** red highlight, border, or tag. Only a keen eye notices the negative sign. |
| **`bug_text`** | **Broken Raw HTML in Razr Description** | Dashed red border, `bg-red-500/5` background, and a bright red "Bug" badge. | Blends naturally into the product catalog card. Description is displayed inside a standard container. No borders, alerts, or hints. The raw `<script>` tags and corrupt characters appear inline as if it were a genuine rendering crash. |
| **`bug_filter`**| **Blank Screen Category Filter** | Dotted/dashed red block in the main panel with an alert triangle and text saying "Filter Bug Detected". | When selecting "Accessories", the screen renders completely blank, showing only the header and categories, as a real app crash would. No tutorial helpers or triangles. Tapping anywhere on the empty catalog screen triggers the click wrapper for the filter bug. |
| **`bug_loop`**  | **Quantity Reset Loop** | Dashed border, red background wrapper, and a flashing red dot with a ping animation. | Appears as a completely standard quantity indicator box inside the cart. Tapping `+` resets it to `0` with standard animations. Tapping on the quantity number itself (or the cart item block) triggers the bug report. No flashing indicators or animations highlighting the error. |
| **`bug_layout`**| **Overlapping Checkout Button** | Overlay with `opacity-0 hover:opacity-100` displaying a flashing red text: "REPORT OVERLAP BUG". | The Secure Checkout button overlaps the Subtotal text due to a native CSS margin error (`style={{ marginTop: '-8px' }}`). The flashing text overlay is removed. Tapping the overlapped collision area naturally triggers the reporting handler. |

---

## 📝 2. Real-Life QA Reporting Experience

When a player clicks/taps an anomalous element, the game is temporarily paused (timer frozen) and the **QA Reporting Modal** is shown.

### The Modal Layout
Unlike the previous implementation which pre-populated the Title and Description, the fields are now **completely blank**, prompting active user input.

```
+--------------------------------------------------------------+
| 🐛 REPORT SIMULATED BUG                                      |
+--------------------------------------------------------------+
| [!] Enter details exactly like a professional QA Engineer:   |
|                                                              |
| * Bug Title (Min. 5 chars)                                   |
| [ Write a concise title of the issue...                     ] |
|                                                              |
| * Bug Description (Min. 15 chars)                            |
| [ Explain how you reproduced it and what went wrong...      ] |
|                                                              |
| 💡 QA Tip: Describe the expected vs. actual behavior!        |
|                                                              |
|  +-------------------------+     +------------------------+  |
|  |       Cancel            |     |     Submit Report      |  |
|  +-------------------------+     +------------------------+  |
+--------------------------------------------------------------+
```

### Input Validation
* **Title Field:** Must be at least **5 characters**.
* **Description Field:** Must be at least **15 characters**.
* If the user submits shorter or spam-like responses (e.g. "it broke" or "bug price"), a descriptive visual helper advises them to elaborate on the issue before allowing submission.

---

## 🏆 3. Gamified Scoring & Pontuation System

To award skill, vocabulary precision, and speed, the scoring system is updated with a multi-layered formula:

$$\text{Total Points} = \text{Base Severity Points} + \text{Description Quality Bonus} + \text{Time Remaining Bonus} + \text{Streak Combo Bonus}$$

### A. Severity Tiers & Base Points
Each of the 5 seeded bugs has an assigned difficulty based on how hidden or nested it is in the user flow:

| Severity | Bug ID | Bug Title / Target | Base Points | Discovery Scent |
| :--- | :--- | :--- | :---: | :--- |
| **Easy** | `bug_price` | Negative Price on Moto G Power | **100** | Visible directly in the main store listing. |
| **Easy** | `bug_text` | Broken Raw HTML in Razr | **100** | Visible directly in the main store listing. |
| **Medium** | `bug_filter`| Blank Screen Category Filter | **250** | Requires clicking the "Accessories" filter and realizing it crashed. |
| **Hard** | `bug_loop` | Quantity Reset Loop | **500** | Requires adding a product, opening the cart, and incrementing quantity. |
| **Hard** | `bug_layout`| Overlapping Checkout Button | **500** | Requires opening the cart and finding the visual overlap. |

---

### B. QA Quality Bonus (Semantic Keyphrase Matching)
To check if the user actually understood the bug (rather than spamming random characters), the reporting system parses the user's description. The player is awarded points based on keyword hits:

* **Keyword Match Criteria:**
  * **0 matches:** `+0` points (Base score is still granted if character validation is met).
  * **1 match:** `+50` points.
  * **2+ matches:** `+100` points (**Maximum QA Quality Bonus**).

#### Expected Keywords by Bug:

* **`bug_price` Keywords:**
  `negative`, `price`, `minus`, `cost`, `g power`, `value`, `subzero`, `less`, `below`
* **`bug_text` Keywords:**
  `html`, `corrupt`, `tag`, `code`, `razr`, `broken`, `text`, `description`, `raw`
* **`bug_filter` Keywords:**
  `blank`, `empty`, `filter`, `accessory`, `accessories`, `clear`, `disappear`, `white`
* **`bug_loop` Keywords:**
  `quantity`, `loop`, `reset`, `zero`, `cart`, `increment`, `increase`, `plus`, `math`
* **`bug_layout` Keywords:**
  `overlap`, `checkout`, `button`, `text`, `unreadable`, `layout`, `position`, `total`, `margin`

---

### C. Speed & Streak Combo Bonuses

#### ⏱️ 1. Time Remaining Bonus
If a player identifies and reports a bug fast, they receive a score bonus relative to how much time was left on the 2-minute (120s) challenge timer:

$$\text{Time Bonus} = \text{Seconds Remaining} \times 2$$

* *Example:* If a player reports a bug with **90 seconds** left on the clock:
  $$90 \text{ s} \times 2 = 180 \text{ bonus points}$$

#### 🔥 2. Streak Combo Bonus (Find Bugs Quick)
If a player is in the zone and captures another bug within **30 seconds** of their previous successful bug report, they trigger a **Combo Streak**:

* **2x Streak (2nd consecutive bug in <30s):** `+50` points
* **3x Streak (3rd consecutive bug in <30s):** `+100` points
* **4x Streak (4th consecutive bug in <30s):** `+200` points
* **5x Streak (Full Sweep in <30s gaps):** `+400` points!

---

## 📊 Score Calculation Scenario Examples

### Scenario A: The Speedster (High Speed, High Precision)
A player enters the store, spots the negative price (`bug_price` - Easy, 100 base) in 10 seconds (110s remaining), and writes: *"The Moto G Power shows a **negative** **price** of -$999"*.
* **Base Points:** 100 (Easy)
* **Quality Bonus:** +100 (2 matches: `negative`, `price`)
* **Time Bonus:** +220 (110s remaining * 2)
* **Streak Bonus:** +0 (first report)
* **Total Score for Bug 1:** **420 points**

15 seconds later (95s remaining), they tap the blank accessories catalog (`bug_filter` - Medium, 250 base) and write: *"The **filter** is showing a **blank** page"*.
* **Base Points:** 250 (Medium)
* **Quality Bonus:** +100 (2 matches: `filter`, `blank`)
* **Time Bonus:** +190 (95s remaining * 2)
* **Streak Bonus:** +50 (Streak 2x - reported 15s after last bug)
* **Total Score for Bug 2:** **590 points**

### Scenario B: The Spammer (Fast but Lazy)
A player clicks the Negative Price listing, but writes: *"bug here guys"* (no keywords matched).
* **Base Points:** 100 (Easy)
* **Quality Bonus:** +0 (no matching keywords)
* **Time Bonus:** +180 (90s remaining * 2)
* **Streak Bonus:** +0
* **Total Score:** **280 points**

---

## 🛠️ Technical Blueprint for Developers

To implement this updated user experience, developers must implement the following code architectural changes on the frontend and backend:

### 1. Frontend Schema Update (React)
Add difficulty, keyword mapping, and state trackers for streaks:

```typescript
// frontend/src/constants.ts refactored additions

export interface BugMetadata {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  basePoints: number;
  keywords: string[];
}

export const BUG_METADATA: Record<string, BugMetadata> = {
  bug_price: {
    id: "bug_price",
    difficulty: "easy",
    basePoints: 100,
    keywords: ["negative", "price", "minus", "cost", "g power", "value", "subzero"]
  },
  bug_text: {
    id: "bug_text",
    difficulty: "easy",
    basePoints: 100,
    keywords: ["html", "corrupt", "tag", "code", "razr", "broken", "text", "description", "raw"]
  },
  bug_filter: {
    id: "bug_filter",
    difficulty: "medium",
    basePoints: 250,
    keywords: ["blank", "empty", "filter", "accessory", "accessories", "clear", "disappear", "white"]
  },
  bug_loop: {
    id: "bug_loop",
    difficulty: "hard",
    basePoints: 500,
    keywords: ["quantity", "loop", "reset", "zero", "cart", "increment", "increase", "plus", "math"]
  },
  bug_layout: {
    id: "bug_layout",
    difficulty: "hard",
    basePoints: 500,
    keywords: ["overlap", "checkout", "button", "text", "unreadable", "layout", "position", "total", "margin"]
  }
};
```

Keep track of the last report timestamp to calculate combo streaks:

```typescript
// Inside frontend App.tsx State Trackers
const [lastReportTime, setLastReportTime] = useState<number | null>(null);
const [currentStreak, setCurrentStreak] = useState<number>(0);
```

### 2. Backend Submission Payload Refactoring (FastAPI)
The payload submitted to `/api/bug_reports` must pass additional gamified parameters (or calculate them server-side):

```python
# backend/main.py Refactored Pydantic Model
class BugReportCreate(BaseModel):
    player_id: str
    bug_id: str
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=15)
    seconds_remaining: int # Sent from mobile countdown
    streak_count: int      # Sent from frontend streak detector
```

Update `add_bug_report` logic inside `backend/database.py` to process dynamic scoring:

```python
# backend/database.py refactored pseudo-code
def calculate_bug_score(bug_id, title, description, seconds_remaining, streak_count):
    # Fetch metadata
    meta = BUG_METADATA_MAPPING[bug_id]
    score = meta["base_points"]
    
    # 1. Quality Keyword Match (Fuzzy Semantic Check)
    matched = 0
    desc_lower = description.lower()
    for kw in meta["keywords"]:
        if kw in desc_lower:
            matched += 1
            
    if matched >= 2:
        score += 100
    elif matched == 1:
        score += 50
        
    # 2. Time remaining bonus
    score += (seconds_remaining * 2)
    
    # 3. Streak Bonus
    streak_bonuses = [0, 0, 50, 100, 200, 400] # indices representing streak counts 1 to 5
    if streak_count <= 5:
        score += streak_bonuses[streak_count]
    else:
        score += 400
        
    return score
```

### 3. Leaderboard Ranking
The desktop dashboard ranking table sorts players by `score DESC` (which is now accumulated point score, e.g. `2450 pts`, rather than raw count of bugs found, e.g. `4/5`), showing players with both the highest testing quality and the fastest discovery times!
