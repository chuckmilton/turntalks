import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import fetch from "node-fetch"; // Ensure node-fetch is installed in your functions folder

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({ apiKey: functions.config().openai.key });

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
      // Build the text part of the prompt.
      let textPart = `Host prompt: ${after.prompt}\nParticipant responses:\n`;
      after.participants.forEach((participant: Participant) => {
        const response = after.responses[participant.id] || "No response";
        textPart += `${participant.nickname}: ${response}\n`;
      });
      textPart += "\nGenerate 10 questions based on the above.";

      // If a file exists, fetch it and prepare a file message.
      let userContent: any;
      if (after.file) {
        try {
          const fileResponse = await fetch(after.file);
          const fileBuffer = await fileResponse.arrayBuffer();
          const base64String = Buffer.from(fileBuffer).toString("base64");
          userContent = [
            {
              type: "file",
              file: {
                filename: "uploaded.pdf",
                file_data: `data:application/pdf;base64,${base64String}`,
              },
            },
            { type: "text", text: textPart },
          ];
        } catch (fetchError) {
          console.error("Error fetching file:", fetchError);
          // Fallback: use only text if file fetch fails.
          userContent = textPart;
        }
      } else {
        userContent = textPart;
      }

      // Log the prompt for debugging.
      console.log("User Message Content:", JSON.stringify(userContent, null, 2));

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: userContent },
          ],
          max_tokens: 150,
        });
        console.log("OpenAI API Response:", JSON.stringify(completion, null, 2));
        const messageObj = completion.choices[0].message;
        if (!messageObj || !messageObj.content) {
          throw new Error("No message content returned");
        }
        const aiResponse = messageObj.content.trim();
        console.log("Extracted AI Response:", aiResponse);
        await db.collection("rooms").doc(roomCode).update({
          aiResponse,
          status: "completed",
        });
      } catch (error) {
        console.error("Error generating AI response:", error);
      }
    } else {
      console.log("Room conditions not met for generating AI response.");
    }
    return null;
  });
