# Interaction Cost

Interaction cost is the total mental, physical, and time effort a user spends to achieve their goal. Every click, scroll, decision, and moment of confusion adds cost. The goal of good UI design is to minimize this cost while still providing all necessary functionality.

## Three Types of Cost

1. **Cognitive effort**: mental processing power to navigate the UI. A complex or unintuitive layout increases cognitive load.
2. **Physical effort**: clicks, keystrokes, scrolling, mouse/thumb movements. Each action has a physical cost.
3. **Time effort**: how long it takes to achieve the goal. Slow loading, complex navigation, and unnecessary steps all add time cost.

## 7 Strategies to Minimize Interaction Cost

### 1. Keep Related Actions Close (Fitts's Law)

Fitts's Law states that targets closer to the user's current position and larger in size are faster to click. In practice:

- Place controls near the elements they affect. An "Edit" button should be next to the thing it edits.
- Make frequently-used buttons large enough to click easily.
- Don't scatter related actions across distant parts of the screen.

**Example:** Spotify places playback controls (play, pause, skip) in a fixed bar at the bottom, always accessible without navigating away.

### 2. Minimize Choice (Hick's Law)

Hick's Law: decision time increases with the number and complexity of choices. Reduce choices to speed up decisions:

- Highlight recommended or popular options.
- Use progressive disclosure: show essential options first, hide advanced ones behind "More options."
- Curate instead of dumping everything on screen (Uber Eats shows "Popular near you" instead of 500 restaurants).

### 3. Respect Working Memory (Miller's Law)

People can hold roughly 7 items (plus or minus 2) in working memory. Help them by:

- Breaking information into manageable chunks with clear headings.
- Using visual grouping (cards, sections, dividers).
- Airbnb does this well: listing pages break info into "About this space," "Amenities," "Reviews" instead of one wall of text.

### 4. Reduce Distractions

Every element that doesn't serve the user's current task is a potential distraction:

- Remove animated banners, auto-playing videos, and pop-ups from task-focused flows.
- Medium's reading experience is the gold standard: clean interface with just the article and essential nav.
- Keep checkout and sign-up flows distraction-free. No ads, no promotional banners.

### 5. Promote Recognition Over Recall

Design so users can recognize what to do rather than having to remember:

- Use familiar icons and symbols (magnifying glass for search, gear for settings).
- Show recent/continuing items ("Continue Watching" on Disney+, "Recent files" in Dropbox).
- Use consistent navigation patterns users have learned from other apps.

### 6. Streamline Tasks

Look for steps you can eliminate or combine:

- Auto-fill addresses from partial input.
- Remember payment methods for returning users.
- Pre-select sensible defaults (country based on IP, most common options pre-checked).
- Every form field you remove is a reduction in interaction cost.

### 7. Reduce Repetition

If users do the same thing repeatedly, make it easier:

- Batch operations (select multiple items, apply action to all).
- Templates and presets for common configurations.
- "Apply to all" options instead of one-by-one configuration.

## Practical Examples

### Product Page Optimization

**Before (high interaction cost):**
- Color selection via dropdown (2 clicks + scroll to see options)
- Quantity via dropdown (2 clicks + scroll)
- "Add to cart" button far from quantity selector

**After (low interaction cost):**
- Color shown as visual swatches (1 click, can see all options immediately)
- Quantity via +/- buttons (1 click each, no dropdown)
- "Add to cart" placed right next to quantity selector
- "Buy now" button added for one-click purchasing

### Form Optimization

- Match field length to expected data: CVC field should be short (3-4 chars), card number should be long.
- Group related fields on the same row when they fit: Expiry + CVC side by side.
- Use separate boxes with large typography for verification codes (4 boxes, not one long input).
- Replace "Confirm password" with a single password field + show/hide toggle.
