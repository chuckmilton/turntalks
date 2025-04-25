# TurnTalks

TurnTalks is an interactive, AI-powered discussion platform originally built for my mother’s book club, and they absolutely loved using it for their sessions! It enables communities to spark creativity and meaningful conversations through dynamic, guided discussions. With TurnTalks, you can:

- Create and manage engaging sessions

- Automatically generate thought-provoking questions using OpenAI

- Listen to questions via custom React TTS integration

- Transcribe participant responses in real time with React Speech-to-Text

- Enforce time limits with a built‑in timer for fast‑paced interaction

- Auto‑summarize discussions and export session PDFs

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Usage](#usage)
  - [Create a Session](#create-a-session)
  - [Answer Questions](#answer-questions)
  - [Review & Summary](#review--summary)
- [Contact](#contact)

---

## Features

- **AI-Generated Questions**: Automatically generate discussion prompts using OpenAI.
- **Speech-to-Text**: Capture participant responses in real time.
- **Text-to-Speech**: Listen to each question in a charming, vintage announcer voice.
- **Timer**: Enforce time limits per response to keep sessions dynamic.
- **Summary & PDF Export**: Automatically summarize session discussions and download as a PDF with branding.
- **User Authentication**: Sign up, login, and manage your profile securely with Supabase.
- **Responsive Design**: Clean, modern UI built with Tailwind CSS and Framer Motion animations.

---

## Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase (Auth, Database)
- **AI Integration**: OpenAI API for question generation and summarization
- **Voice**: React Text-to-Speech
- **PDF Export**: jsPDF

---

## Usage

### Create a Session

1. Log in or sign up.
2. Click **Create New Session**.
3. Provide a prompt, optional reference PDF, and number of questions.
4. Invite participants or proceed.

### Answer Questions

1. Each question is read aloud in a theatrical voice.
2. Participants take turns responding via microphone.
3. Speech-to-text transcribes responses in real time.

### Review & Summary

1. Once all questions are answered, view the auto-generated summary.
2. Play the summary via TTS or download as PDF.
3. Rate the session and return to the dashboard.

---

## Contact

For questions or feedback, please reach out:

- Email: [turntalks.official@gmail.com](mailto:turntalks.official@gmail.com)

