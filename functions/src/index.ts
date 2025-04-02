import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

interface Participant {
  id: string;
  nickname: string;
}

export const generateAIResponse = functions.firestore
  .document("rooms/{roomCode}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const roomCode = context.params.roomCode;
    if (!after) return null;

    // If an AI response already exists, do nothing.
    if (after.aiResponse) return null;

    // Only process when room is in-session and all participants have answered.
    if (
      after.status === "in-session" &&
      after.participants &&
      after.responses &&
      Object.keys(after.responses).length === after.participants.length
    ) {
      let combinedPrompt = `Host prompt: ${after.prompt}\n`;
      if (after.file) {
        combinedPrompt += `File context: ${after.file}\n`;
      }
      combinedPrompt += "Participant responses:\n";
      after.participants.forEach((participant: Participant) => {
        const response = after.responses[participant.id] || "No response";
        combinedPrompt += `${participant.nickname}: ${response}\n`;
      });

      try {
        const completion = await openai.completions.create({
          model: "text-davinci-003",
          prompt: combinedPrompt,
          max_tokens: 150,
        });
        const aiResponse = completion.choices[0].text.trim();

        await db
          .collection("rooms")
          .doc(roomCode)
          .update({
            aiResponse,
            status: "completed",
          });
      } catch (error) {
        console.error("Error generating AI response:", error);
      }
    }
    return null;
  });
