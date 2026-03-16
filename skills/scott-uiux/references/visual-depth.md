# Visual Cues & Depth

## Icon Consistency

Pick ONE icon style and use it across all screens. This means choosing either outlined or filled icons, not mixing them randomly. The visual inconsistency of mixed icon styles is subtle but it makes your UI feel unpolished, like wearing one dress shoe and one sneaker.

- **Outlined icons**: lighter, more modern feel. Good for clean/minimal designs.
- **Filled icons**: bolder, more prominent. Good for emphasis and visual weight.
- **Exception**: bottom/tab navigation commonly uses filled for the active tab and outlined for inactive tabs. This serves a functional purpose (showing the user where they are) and is a well-established pattern users understand.
- Use a single icon set (Heroicons, Lucide, Phosphor, etc.). Don't mix Heroicons on one screen with Font Awesome on another.

## Visual Cues & Illustrations

Visual cues make information more engaging and easier to process than text alone.

- Use illustrations for onboarding steps, empty states, and feature explanations.
- In list UIs (email, contacts, chat), profile images/avatars help users scan faster than plain text. Progression: no avatar < colored letter initial < actual photo.
- Add icons to feature lists, menu items, and navigation to give users visual anchors.

## Shadows

Shadows create a sense of depth, helping users understand which elements are interactive, elevated, or floating above the page.

### Use Soft Shadows
Harsh, dark shadows look unprofessional. The trick is soft shadows that blend with the background:

**Good shadow values:**
- `box-shadow: 0 12px 48px #E9E9E9` (light backgrounds)
- Avoid `box-shadow: 0 0 48px #9F9F9F` (too dark, no Y-offset)

The Y-offset matters: a slight downward offset (Y: 12px) creates a natural "light from above" effect that mimics real-world shadows.

### Match Shadow Color to Background
This is a pro-level detail that separates polished designs from amateur ones:

- **White/light grey background**: grey-tinted shadow (#E9E9E9)
- **Purple background**: purple-tinted shadow (#CFC9DD), not grey (#C7C7C7)
- **Yellow/warm background**: warm-tinted shadow (#E3D5B2), not grey (#D8D8D8)

Grey shadows on colored backgrounds create visual discord. Tinting the shadow to match the background makes the whole design feel cohesive.

### Shadow System
Define at least 3 shadow levels for consistency:

1. **Soft Shadow** (xs/sm): buttons, small cards, thumbnails. Subtle lift off the page.
2. **Medium Shadow** (md/lg): modals, pop-up windows, floating panels. More focus and separation.
3. **Strong Shadow** (xl/2xl): dropdown menus, important alerts, elements that need to really stand out.

### Shadows Over Dynamic Backgrounds
Elements overlapping complex backgrounds (maps, images, video) need shadows to remain readable. Without them, UI elements blend into the busy background and become invisible.

## Depth Through Backgrounds & Outlines

You don't need shadows for every depth effect. Two simpler alternatives:

### Background Color Layering
A light grey background (#F5F5F5) with white cards on top creates a natural layered effect. This works especially well for dashboards and content-heavy pages where you need to visually separate sections without adding visual weight.

### Outlines
Thin lines can segment areas and guide the eye. But restraint is critical:

- **Fewer borders = cleaner look.** Before adding a border, ask: "Can I use white space or a subtle background color change instead?"
- When you do use borders: thin (1px) and light colored. Thick, dark borders make interfaces feel heavy and outdated.
- **Exception**: thick borders can work when intentional and balanced. A flight search box with a bold 10px border can feel premium if the rest of the design supports it. The key is deliberate choice, not default.

## Glassmorphism

The frosted glass effect (backdrop-filter: blur) adds a modern, futuristic touch when used correctly.

**When it works:** dark or high-contrast backgrounds where text remains crisp and readable. A video player overlay on a nature documentary, for example.

**When it fails:** light backgrounds. The blur makes text hard to read and kills accessibility. If you can't easily read every word, the glass effect is hurting, not helping.

The glass effect must serve the experience, not just chase a trend. Ask: "Does this make the content easier or harder to use?"
