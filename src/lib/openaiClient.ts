export const runtime = 'nodejs';

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Updated interface: support file_id, filename, and file_data.
interface FileInput {
  file_id?: string;   // Use if you've already uploaded the file via OpenAI's Files API.
  filename?: string;  // Use when providing Base64-encoded file data.
  file_data?: string; // Base64-encoded data with MIME prefix, e.g. "data:application/pdf;base64,..."
}

/**
 * Define the expected structure for text message parts.
 * This matches what the API expects for a text message when sending an array.
 */
interface ChatCompletionContentPartText {
  type: "text";
  text: string;
}

/**
 * Define the expected structure for file message parts.
 * (Adjust this interface if your model supports richer file inputs.)
 */
interface ChatCompletionContentPartFile {
  type: "file";
  file: {
    file_id?: string;
    filename?: string;
    file_data?: string;
  };
}

/**
 * Our union type for a message part.
 * The API accepts either text parts or file parts.
 */
type ChatCompletionContentPart = ChatCompletionContentPartText | ChatCompletionContentPartFile;

/**
 * Minimal interface for session data in summary generation.
 */
interface SessionData {
  prompt: string;
  end_goal: string;
  answers: unknown;
}

/**
 * Generates a question based on a prompt and previous answers.
 * Optionally includes file context. If a file is provided, the message content is an array
 * containing a file part and then a text part; otherwise it's a plain string.
 */
export async function generateQuestion(
  prompt: string,
  context: string,
  fileInput?: FileInput
): Promise<string> {
  try {
    let messageContent: string | ChatCompletionContentPart[];
    if (fileInput) {
      if (fileInput.file_id) {
        messageContent = [
          {
            type: "file",
            file: { file_id: fileInput.file_id },
          },
          {
            type: "text",
            text: `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`,
          },
        ];
      } else if (fileInput.file_data && fileInput.filename) {
        messageContent = [
          {
            type: "file",
            file: { filename: fileInput.filename, file_data: fileInput.file_data },
          },
          {
            type: "text",
            text: `Based on this prompt: "${prompt}" and previous answers: "${context}", generate a thought-provoking question.`,
          },
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
    return completion.choices[0].message.content ?? "";
  } catch (error) {
    console.error("Error generating question:", error);
    return "Error generating question.";
  }
}

/**
 * Generates a summary based on session data.
 * Optionally includes a file input. When a file is provided, the message content
 * is an array containing a file part and then a text part; otherwise it's a plain string.
 */
export async function generateSummary(
  sessionData: SessionData,
  fileInput?: FileInput
): Promise<string> {
  try {
    const contextStr = `Prompt: ${sessionData.prompt}\nEnd Goal: ${sessionData.end_goal}\nAnswers: ${JSON.stringify(
      sessionData.answers
    )}`;
    let messageContent: string | ChatCompletionContentPart[];
    if (fileInput) {
      if (fileInput.file_id) {
        messageContent = [
          {
            type: "file",
            file: { file_id: fileInput.file_id },
          },
          {
            type: "text",
            text: `Based on the session data:\n${contextStr}\nProvide a concise summary addressing the end goal.`,
          },
        ];
      } else if (fileInput.file_data && fileInput.filename) {
        messageContent = [
          {
            type: "file",
            file: { filename: fileInput.filename, file_data: fileInput.file_data },
          },
          {
            type: "text",
            text: `Based on the session data:\n${contextStr}\nProvide a concise summary addressing the end goal.`,
          },
        ];
      } else {
        messageContent = `Based on the session data:\n${contextStr}\nProvide a concise summary addressing the end goal.`;
      }
    } else {
      messageContent = `Based on the session data:\n${contextStr}\nProvide a concise summary addressing the end goal.`;
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
    return completion.choices[0].message.content ?? "";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary.";
  }
}
