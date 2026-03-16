# Color & Typography

## Color

### Primary Color: Less is More

The most common mistake with brand color is using it everywhere. When every button, label, heading, and icon is drenched in your primary color, the user has no visual guide for what's interactive and what isn't. The color loses its power to direct attention.

Instead, reserve your primary color for:
- Call-to-action buttons
- Links
- Active/selected states
- Interactive elements

Everything else (text, backgrounds, borders, non-interactive icons) should use neutrals. This way, when a user sees your primary color, they instinctively know "I can click/tap that."

### Background Colors

- **Neutral backgrounds** (grey, beige, soft white) let content pop without competing for attention.
- **Vibrant/colored backgrounds** reduce readability and overwhelm users. Reserve them for splash screens, hero headers, and specialized sections.
- **Dark backgrounds** are great: they reduce glare, minimize eye strain in low-light, and provide appealing contrast. Dark mode is a must-have feature.
- Let the user choose between light and dark mode. Both have legitimate use cases.

### Don't Rely on Color Alone

About 8% of men and 0.5% of women have some form of color vision deficiency. Beyond that, anyone in bright sunlight might struggle to distinguish subtle color differences. So:

- Never use color as the ONLY indicator of state.
- Always pair color with at least one other cue:
  - Icon (exclamation mark, checkmark, warning triangle)
  - Text label ("Error: Enter amount bigger than $1")
  - Pattern or shape change

**Example:** An error state should have: red border + warning icon + descriptive error message. Not just a red border.

### Status Color Conventions

These are deeply ingrained in users' mental models. Breaking them creates confusion:

| Color | Meaning | Example |
|-------|---------|---------|
| Red | Error, danger, destructive, stop | Form errors, delete buttons |
| Green | Success, positive, go | Confirmation, completed status |
| Yellow/Orange | Warning, caution, attention | Expiring sessions, validation warnings |
| Blue | Information, neutral, link | Info banners, hyperlinks |

You can adjust the specific shade to match your brand (a warmer red, a teal-ish green), but the meaning must remain the same.

## Typography

### Choosing the Right Font

The font you choose sets the emotional tone of your entire interface:

- **Serif fonts** (Times, Georgia, Playfair Display): formal, classic, trustworthy. Good for law firms, accounting, education, editorial.
- **Script fonts** (handwriting-style): warm, personalized, luxurious. Good for beauty brands, invitations.
- **Sans-serif fonts** (Inter, Roboto, Open Sans): modern, clean, readable. The default choice for tech, apps, and most digital products.

Reliable sans-serif options: **Inter, Gotham, Lato, Open Sans, San Francisco, Helvetica, Manrope, Roboto**. These balance style with readability. Google Fonts is a reliable, free, license-safe source.

### Maximum 2 Fonts

Using more than two fonts makes a design look cluttered and unprofessional.

**Best practice:** One versatile font (like Inter) used with different weights (Regular for body, Semibold for headings, Bold for emphasis) and sizes. This alone can create all the hierarchy you need.

**Advanced (if you want two):** Use one font for headings and another for body text. Classic pairings:
- Playfair Display (headings) + Source Sans Pro (body)
- Raleway (headings) + Merriweather (body)
- Montserrat (headings) + Open Sans (body)

### Text Contrast Values

Never use pure extremes. Off-black and off-white create softer, more sophisticated contrast that's easier on the eyes:

**Light theme:**
| Element | Color | Example |
|---------|-------|---------|
| Headings | #1A1A1A | Dark but not pure black |
| Body text | #4E4E4E | Lighter grey, readable |

**Dark theme:**
| Element | Color | Example |
|---------|-------|---------|
| Headings | #F2F2F2 | Bright but not pure white |
| Body text | #CACACA | Softer, less eye strain |

### Font Weights

Weight creates hierarchy. Use it deliberately:

- **Headings**: Bold (700), Semibold (600), or Medium (500). These grab attention.
- **Body text**: Regular (400) or Light (300). These should be readable but not compete with headings.
- Never use the same weight for headings and body. If everything is Regular, nothing stands out. If everything is Bold, nothing stands out either.

**Exception:** Some modern sites (Pleo, Linear) use lighter heading weights but compensate with much larger font sizes and darker colors. This works because size and color are doing the hierarchy work that weight normally does.

### Font Sizes

- **Body text gold standard: 16px.** This hits the sweet spot for most people on most devices.
- **Never go below 12px** for any visible text.
- **Below 10px**: avoid entirely. It's an accessibility issue and most users can't read it comfortably.
- Headings should be noticeably larger than body text. If your heading is 18px and body is 16px, there's not enough contrast to create hierarchy. Try 28-32px headings with 16px body.

### Line Height

Line height (the vertical space between lines of text) dramatically affects readability:

- **Body text (16px)**: line-height 1.5 to 1.6 (150-160%). This is the sweet spot.
- **Below 1.2**: text feels cramped and hard to read.
- **Above 2.0**: lines feel disconnected, like they're floating apart.

**The inverse rule:** bigger text can use smaller line-height, smaller text needs bigger line-height:
- **Headings (28-36px)**: line-height 1.2-1.3 (120-130%). Compact and impactful.
- **Body (16px)**: line-height 1.5-1.6 (150-160%). Spacious and readable.

### Line Length

Research-backed sweet spots:
- **Desktop**: 45-75 characters per line
- **Mobile**: 30-40 characters per line

Text that stretches across a full monitor is exhausting to read because your eyes have to travel too far from the end of one line to the start of the next. Constraining line length (via max-width on text containers) is one of the easiest readability wins.

### Text Alignment

- **Left-aligned**: use for paragraphs, lists, and any long-form content. It creates a consistent left edge that readers' eyes can return to predictably.
- **Center-aligned**: use only for titles, short headings, and hero text. Center-aligned paragraphs create ragged left edges that make reading harder.
- **Right alignment**: decorative/special cases only.

### Accessibility Contrast

- Minimum contrast ratio: **4.5:1** for normal text (WCAG AA standard).
- Light text that FAILS: #A9A9A9 on white (too light, fails both AA and AAA).
- Light text that PASSES: #626262 on white (passes both AA and AAA).
- Tools: WebAIM contrast checker, Coolors.co, Figma's Contrast plugin by WillowTree.
- Avoid extra-light font weights (Inter Extra Light, Inter Thin) for body text. The thin strokes can blend into backgrounds, especially on lower-resolution screens.
