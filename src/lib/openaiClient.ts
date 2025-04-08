// /lib/openaiClient.ts
export const runtime = 'nodejs';

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Updated interface: only support file_id.
interface FileInput {
  file_id?: string;
}

/**
 * Generates a question based on a prompt and previous answers.
 * If file context is provided (by supplying a valid file_id), it will include that file in the conversation.
 */
export async function generateQuestion(
  prompt: string,
  context: string,
  fileInput?: FileInput
): Promise<string> {
  console.log("generateQuestion fileInput:", fileInput);
  
  // Build the default text message.
  const defaultTextMessage = {
    type: "text",
    text: `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`
  };

  // Create the message content array.
  let messageContent: Array<{ type: string; [key: string]: any }> = [];

  if (fileInput && fileInput.file_id) {
    // If we have a valid file_id, include a file message followed by the text message.
    messageContent.push({
      type: "file",
      file: { file_id: fileInput.file_id },
    });
    messageContent.push(defaultTextMessage);
  } else {
    // No file context; just use the text message.
    messageContent.push(defaultTextMessage);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o", // Be sure this model supports file inputs.
      messages: [{
        role: "user",
        content: messageContent as any,
      }],
    });

    return completion.choices[0].message.content ?? "No content generated.";
  } catch (error) {
    console.error("Error generating question:", error);
    return "Error generating question.";
  }
}

/**
 * Generates a summary based on session data.
 * If file context is provided (via a valid file_id), it will include that file in the conversation.
 */
export async function generateSummary(
  sessionData: any,
  fileInput?: FileInput
): Promise<string> {
  const context = `Prompt: ${sessionData.prompt}\nEnd Goal: ${sessionData.end_goal}\nAnswers: ${JSON.stringify(sessionData.answers)}`;
  const defaultTextMessage = {
    type: "text",
    text: `Based on the session data:\n${context}\nProvide a concise summary addressing the end goal.`
  };

  let messageContent: Array<{ type: string; [key: string]: any }> = [];

  if (fileInput && fileInput.file_id) {
    messageContent.push({
      type: "file",
      file: { file_id: fileInput.file_id },
    });
    messageContent.push(defaultTextMessage);
  } else {
    messageContent.push(defaultTextMessage);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: messageContent as any,
      }],
    });

    return completion.choices[0].message.content ?? "No content generated.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary.";
  }
}
