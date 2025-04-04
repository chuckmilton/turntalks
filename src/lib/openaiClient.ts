// /src/lib/openaiClient.ts
export const runtime = 'nodejs'; // Ensures this module runs only on the server

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface FileInput {
  file_id?: string;   // Use if you've already uploaded the file via OpenAI's Files API.
  filename?: string;  // Use for Base64-encoded file data.
  file_data?: string; // Base64-encoded data with MIME prefix, e.g. "data:application/pdf;base64,..."
}

/**
 * Generates a question based on a prompt and previous answers.
 * Optionally, include a file input.
 */
export async function generateQuestion(
  prompt: string,
  context: string,
  fileInput?: FileInput
): Promise<string> {
  try {
    let messageContent;
    if (fileInput) {
      if (fileInput.file_id) {
        messageContent = [
          { type: "file", file: { file_id: fileInput.file_id } },
          {
            type: "text",
            text: `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`
          }
        ];
      } else if (fileInput.file_data && fileInput.filename) {
        messageContent = [
          { type: "file", file: { filename: fileInput.filename, file_data: fileInput.file_data } },
          {
            type: "text",
            text: `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`
          }
        ];
      } else {
        messageContent = `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`;
      }
    } else {
      messageContent = `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o", // or choose "gpt-3.5-turbo" as needed
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating question:", error);
    return "Error generating question.";
  }
}

/**
 * Generates a summary based on session data.
 * Optionally, include a file input.
 */
export async function generateSummary(
  sessionData: any,
  fileInput?: FileInput
): Promise<string> {
  try {
    const context = `Prompt: ${sessionData.prompt}\nEnd Goal: ${sessionData.end_goal}\nAnswers: ${JSON.stringify(sessionData.answers)}`;
    let messageContent;
    if (fileInput) {
      if (fileInput.file_id) {
        messageContent = [
          { type: "file", file: { file_id: fileInput.file_id } },
          {
            type: "text",
            text: `Based on the session data:\n${context}\nProvide a concise summary addressing the end goal.`
          }
        ];
      } else if (fileInput.file_data && fileInput.filename) {
        messageContent = [
          { type: "file", file: { filename: fileInput.filename, file_data: fileInput.file_data } },
          {
            type: "text",
            text: `Based on the session data:\n${context}\nProvide a concise summary addressing the end goal.`
          }
        ];
      } else {
        messageContent = `Based on the session data:\n${context}\nProvide a concise summary addressing the end goal.`;
      }
    } else {
      messageContent = `Based on the session data:\n${context}\nProvide a concise summary addressing the end goal.`;
    }
    
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary.";
  }
}
