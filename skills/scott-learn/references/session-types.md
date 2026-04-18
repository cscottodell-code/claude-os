# Learning Session Types

Six session types, all delivered in NotebookLM. The `/scott:learn` skill prepares
the notebook and tracks results. Scott does the session in NotebookLM.

## Session Type Definitions

### 1. Overview
**Format:** Lesson. NotebookLM teaches the material in a structured way.
**What it builds:** Foundation. First exposure or refresher.
**Depth target:** findable --> understood
**NotebookLM output type:** study
**Studio prompt pattern:** "Teach [topic] as a structured lesson. Start with why
it matters. Walk through each component with examples. Use spreadsheet analogies
where helpful. End with 3 key takeaways the user should remember."
**When to use:** First engagement with new material, or refresher on stale topics.

### 2. Vocabulary
**Format:** Term quiz. NotebookLM gives terms, user defines them (and vice versa).
**What it builds:** Precision. Correct use of terminology.
**Depth target:** findable --> understood
**NotebookLM output type:** study
**Studio prompt pattern:** "Quiz the user on key terms from these sources. Alternate
between: (1) give the term, ask for definition, (2) give the definition, ask for
the term. Score accuracy. Correct wrong answers immediately with the right definition."
**When to use:** After an overview, to lock in terminology.

### 3. Quiz
**Format:** Multiple choice. Tests recall and ability to distinguish between concepts.
**What it builds:** Retention. Can you recognize correct answers?
**Depth target:** understood (reinforcement)
**NotebookLM output type:** study
**Studio prompt pattern:** "Create a multiple-choice quiz with 10 questions about
[topic]. Present one question at a time with 4 options (A-D). After the user answers,
reveal the correct answer and explain WHY it's correct and why the other options are
wrong. Track score and report at the end."
**When to use:** After vocabulary, to test recall.

### 4. Application
**Format:** Scenario-based. Real situations from Scott's work, user applies framework.
**What it builds:** Transfer. Can you use it outside the textbook?
**Depth target:** understood --> internalized
**NotebookLM output type:** chat (with Scott's Context source doc)
**Studio prompt pattern:** "Present realistic scenarios from Scott's work context
(see the Scott's Context source document). For each scenario, ask: 'How would you
apply [framework] here?' After Scott responds, evaluate his application. Push back
if the application is surface-level. Suggest what a deeper application would look like."
**Requires:** Scott's Context source document uploaded as a source.
**When to use:** After quiz, when ready to test real-world transfer.

### 5. Connection
**Format:** Guided lesson showing links between ideas across domains.
**What it builds:** Integration. How does this relate to everything else?
**Depth target:** understood --> internalized
**NotebookLM output type:** chat (with multi-domain source docs)
**Studio prompt pattern:** "Show the user unexpected connections between these topics
from different domains. Present a connection, explain why it matters, then ask the
user: 'Can you think of another connection between these ideas?' Build on their
responses. Challenge shallow connections. Reward deep ones."
**Requires:** Source docs from 2+ wiki domains.
**When to use:** When 2+ related topics are at "understood" or higher.

### 6. Teaching
**Format:** Scott teaches the principle back. NotebookLM plays a curious student.
**What it builds:** Mastery. If you can teach it, you own it.
**Depth target:** internalized --> applied
**NotebookLM output type:** chat (with student persona)
**Studio prompt pattern:** "You are a curious beginner who wants to learn [topic].
Let the user teach you. Ask naive questions. If their explanation has gaps, ask
follow-up questions that expose the gap without telling them the answer. Push back
on vague statements: 'Can you give me a specific example?' If they say something
wrong, gently question it: 'I thought [X], is that different from what you said?'"
**When to use:** When topic is at "internalized" and ready for mastery test.

## Session Selection Logic

When `/scott:learn --prep` runs without explicit type/topic:

1. **Check overdue reviews first.** Any topic where today > next_review? Pick
   the most overdue. Session type based on current depth:
   - findable: overview
   - understood: quiz or application (alternate)
   - internalized: teaching or connection (alternate)
   - applied: connection (find new links to maintain freshness)

2. **Check exploration gaps.** Any topic where some session types are incomplete?
   Prioritize the next uncompleted type in order: overview --> vocabulary --> quiz
   --> application --> connection --> teaching.

3. **Check recently captured.** Any new "learn" items in inbox processed in the
   last 24 hours? Schedule an overview.

4. **Check current work relevance.** Read tasks/todo.md or Eleanor's current phase.
   Any wiki pages connected to active work that are below "understood"? Prioritize.

5. **Default:** Pick the topic with the lowest depth and oldest last_reviewed date.

Pick 3-5 topics per session. Mix types if possible (e.g., 1 quiz + 1 application
+ 1 overview of new material).
