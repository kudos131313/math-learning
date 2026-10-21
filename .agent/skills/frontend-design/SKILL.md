---
name: frontend-design
description: Guidelines for refactoring and designing UI for Grade 2 math educational tools. Enforces pedagogical interaction hierarchy, touch affordance, place-value color coding, and prevents unintended breaking of mathematical state during UI polish.
license: Complete terms in LICENSE.txt
---

# Frontend Design

## Refactor First — Preserve Before Redesigning

When working on an existing application, this skill is a refactoring
guideline, not permission to redesign the product from scratch.

Before changing the UI:

1. Understand the existing information architecture.
2. Identify existing user flows and learning interactions.
3. Identify reusable components, tokens, animations, and interaction patterns.
4. Preserve working behavior unless there is a clear UX or educational reason
   to change it.
5. Preserve existing content, terminology, and learning objectives unless they
   are demonstrably confusing.
6. Prefer incremental improvements over wholesale visual replacement.

Do NOT:
- Replace the entire visual system just because it is aesthetically different.
- Introduce a new component library without need.
- Rewrite working components solely for stylistic preference.
- Add decorative UI that does not improve learning.
- Remove existing educational interactions without validating the replacement.
- Convert the application into a generic SaaS/dashboard aesthetic.

For every substantial visual change, be able to answer:

"What existing problem does this change solve for a Grade 2 student?"

If there is no clear answer, do not make the change.

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified.

## Preserve Mathematical Interaction Logic

Before refactoring an educational component, identify:

- input state
- mathematical state
- derived values
- animation state
- feedback state
- completion state

Do not merge these states merely to simplify the component.

Do not move mathematical logic into presentation code.

Do not change mathematical behavior while performing a visual refactor
unless explicitly required.

The UI should represent the mathematical state, not become the source of
mathematical truth.

## Ground your designs in the subject matter

If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal. If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from — a design for a toy for girls aged 8–11 will be very aesthetically different from a dashboard for financial analysts. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is the first thing viewers will see. Open with the most characteristic thing in the subject's world, in the form that is most appropriate: a headline, an image, an animation, a live demo, an interactive moment, or other treatments. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the default treatment, so only use it if that's truly the best option.

Typography carries the personality of the page. You don't need a different typeface for display or headline text and body content: use one family or two, and if two, make them clearly distinct.

Choose your typefaces deliberately, not the default families you would reach for on any other project, and set a clear type scale following the default guidance of The Elements of Typographic Style with intentional weights, widths, and spacing. When type is used as a headline or visual element, use the type treatment itself as an active part of the design, not a neutral delivery vehicle for the content.

Default to line lengths of less than 80 characters. Serif typefaces can have slightly longer line lengths; give serif body text slightly more line-height than a sans-serif.

Avoid these default typographic treatments; they are the commonest tells of a generated page:
- Accenting just a single word or phrase in a headline for pure decoration (semantic place-value color coding is exempt).
- Using all caps for labels.
- Adding unnecessary typographic labels above content.

Visual structure is information. Structural devices like outlines, borders, numbering, eyebrows, dividers, labels, etc., encode useful information about the content rather than decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence — like a stepped process or a timeline. Before adding numbered markers, check the content really is a sequence.

Use non-user-triggered motion sparingly and deliberately, only to draw attention. A single orchestrated moment — one page-load sequence or one reveal — lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated. Motion that answers a person's action (opening, expanding, confirming) is welcome when it shows what changed.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy and placeholder content. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: Inspect → Plan → Refactor → Verify

For an existing application, do not begin by inventing a new visual direction.

First inspect the existing implementation and identify:
- existing visual language
- component structure
- interaction patterns
- mathematical representations
- current user flows
- inconsistencies and technical debt

Then create a compact refactoring plan.

The plan should distinguish between:
1. Preserve
2. Improve
3. Remove
4. Introduce

Only introduce new visual patterns when they solve a concrete usability,
learning, consistency, or accessibility problem.

Before implementing substantial changes, review the plan against the
educational goals and existing product.

Ask:
- Does this preserve existing learning behavior?
- Does this make the student's next action clearer?
- Does this improve mathematical comprehension?
- Does this reduce unnecessary complexity?
- Is the change actually necessary?

If a proposed change cannot be justified by one of these criteria, do not
make the change.

After implementation, verify the rendered result rather than evaluating
only the source code. Use screenshots when the environment supports them.

## Restraint and self-critique

Spend your boldness in one place. Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes. Critique your own work as you build, taking screenshots to review if your environment supports it — a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creatives have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand and use. They are design content, not decoration. Bring the same intentionality and minimalism to copywriting that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's perspective. Name things by what users will understand in simple language, not by how the system is built. A user manages notifications, not webhook config. Describe what something is or does in plain terms rather than selling it. Being specific and legible to new users is always better than being clever.

Use active voice as default. A CTA says exactly what happens when it is used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the tone conversational: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each written element do exactly one job.


## Domain Override: Grade 2 Math EdTech Constraints
When applying this frontend-design skill to this specific project, apply these exceptions:
1. **Color Coding is Semantic**: Multi-color text accents ARE permitted and
required when syncing digits to Base-10 block types. Each place-value
position must have a consistent semantic color across digits, blocks,
animations, and explanations.
2. **Toy Affordance Over Minimalism**: Buttons must look physically pressable (tactile, chunky, ≥48px) rather than sleek and flat. 
3. **Visual Feedback is Crucial**: Micro-animations showing physical block merging (10 ones snapping into 1 ten) are core teaching mechanisms, not decorative fluff.

## Educational Priority

For this Grade 2 math product, prioritize decisions in this order:

1. Mathematical correctness
2. Student comprehension
3. Interaction clarity
4. Immediate visual feedback
5. Accessibility and readability
6. Consistency
7. Visual delight
8. Aesthetic novelty

Never sacrifice comprehension or mathematical clarity for visual novelty.

## Motion Has Pedagogical Meaning

Animation is allowed and encouraged when it communicates a mathematical
transformation, relationship, or consequence.

Prefer:
- 10 ones physically combining into 1 ten
- regrouping / borrowing
- digits moving to reflect place value
- quantities increasing or decreasing
- answer state changes

Avoid:
- decorative floating elements
- perpetual motion
- animation on every component
- repeated entrance animations
- animation that competes with the current mathematical operation

When multiple animations compete for attention, prioritize the animation
that explains the mathematical concept.

## Grade 2 Student Perspective

Assume the primary user is a 7–8 year old student.

The interface should:

- make the next action obvious
- minimize reading requirements
- use concrete visual representations before abstraction
- make cause and effect immediately visible
- avoid requiring students to understand UI conventions
- provide forgiving interactions
- make mistakes safe and reversible
- keep important controls large and easy to hit
- avoid relying on hover-only behavior
- avoid dense panels and information-heavy layouts

Prefer interactions that move naturally from concrete manipulation
toward visual representation and then symbolic notation.

For example:

Base-10 blocks
→ grouped quantities
→ digits
→ equation

rather than presenting the equation first and expecting the student to
mentally construct the meaning.

## Representation Priority

When introducing or refactoring a mathematical concept, prefer:

Concrete → Visual → Symbolic

Use concrete manipulatives or visual representations to establish meaning
before relying on abstract notation.

However, do not force every interaction through all three levels when the
student has already demonstrated understanding and the additional
representation would add unnecessary complexity.

## Refactor Scope Control

A refactor should not silently become a feature expansion.

Do not introduce new:
- gamification systems
- rewards
- badges
- progress systems
- sounds
- characters
- tutorials
- dialogs
- settings
- navigation patterns

unless they are explicitly requested or clearly necessary to solve an
identified usability or learning problem.

When a potentially useful feature is discovered, note it separately rather
than implementing it during the refactor.

## Consistency Does Not Mean Uniformity

Do not normalize differences merely for visual consistency.

Different sizes, colors, spacing, shapes, or motion may be intentional when
they communicate:
- hierarchy
- mathematical meaning
- interaction priority
- state
- physical affordance

Standardize patterns only when the existing difference has no meaningful
purpose.