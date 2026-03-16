# Layout & Spacing

## White Space

White space is not wasted space. It improves readability, guides focus, and creates visual hierarchy. Think of it like the margins on a printed page: without them, text runs edge-to-edge and becomes exhausting to read.

- Use generous padding inside elements (cards, buttons, sections). Cramped content looks amateur.
- Use spacing to group related items and separate unrelated ones (this is the Law of Proximity from Gestalt psychology: humans perceive items that are close together as belonging to a group).
- Pick a spacing scale and stick to it across the entire project: 4px, 8px, 16px, 24px, 32px, 48px. Arbitrary values (13px here, 17px there) create subtle visual discord.

## Alignment

- Align all elements to a grid. Even small misalignments make a UI feel unpolished.
- Left-align text for readability in Western languages. The consistent left edge gives readers a "home base" for their eyes.
- Center alignment works for short headings, titles, and hero sections. It fails for paragraphs because the ragged left edge disrupts reading flow.
- Don't mix alignment types on the same page without clear purpose.

## Visual Hierarchy

The size, color, weight, and position of elements tell users what matters most.

- Most important elements should be largest and most prominent (biggest heading, brightest CTA).
- Use contrast to draw attention to calls-to-action and key information.
- Establish clear F-pattern (text-heavy pages) or Z-pattern (landing pages) scanning flows. Users don't read every word; they scan in predictable patterns.

## Grouping & Proximity

- Related items should be visually close together. If a label belongs to a form field, it should be closer to its field than to the next field.
- Unrelated items need clear separation: space, lines, or background color differences.
- Group form fields logically: personal info together, payment info together, shipping together.

## Consistency

This is the single highest-leverage design principle.

- If a card has 16px padding on one screen, it should have 16px padding on every screen.
- If buttons are rounded on the settings page, they should be rounded on the checkout page.
- Reuse components rather than creating one-off designs. Every unique element is cognitive debt for the user.

## Padding & Margins

- Internal padding (within elements): minimum 12-16px for interactive elements, more for cards and sections.
- External margins: consistent spacing between sections and page elements.
- Touch targets: minimum 44x44px (Apple HIG) or 48x48px (Material Design). This is not optional; it's an accessibility requirement.

## Don't Fill the Whole Screen

Forms and checkout flows don't need to stretch to fill a 1440px monitor. Constrain content to a comfortable width (400-600px for forms, 800-1200px for content) and let white space do its job. Wide input fields look overwhelming and reduce focus.
