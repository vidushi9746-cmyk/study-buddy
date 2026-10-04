# Study Buddy

A personalized AI study assistant built for the Hacktoberfest 2026 **Build for a Friend** challenge.

## What it does

Study Buddy lets a student paste their notes, ask a question, and choose how they want the answer:

- Explain simply
- Give an analogy
- Make an exam-ready answer
- Generate a quiz

The project uses **Gemma 4**, an open-weight model, through the Gemini API.

## Run locally

1. Install Node.js.
2. Clone/download this project.
3. Run:

```bash
npm install
```

4. Copy `.env.example` to `.env`.
5. Add your Google AI Studio API key:

```env
GEMINI_API_KEY=your_key
```

6. Start:

```bash
npm start
```

7. Open `http://localhost:3000`.

## Why open innovation matters

The app is built around an open-weight model rather than a closed proprietary model. This makes the model choice part of the project itself and gives the project a more transparent, adaptable AI foundation.

## MVP scope

The intentionally small MVP focuses on the core learning loop:

**student notes → personal question → preferred explanation style → answer**

Future ideas include PDF parsing, saved study sessions, spaced repetition, progress tracking, and local/offline inference.
