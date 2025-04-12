export const runtime = 'nodejs';

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Updated interface: support file_id, filename, and file_data.
interface FileInput {
  file_id?: string;
  filename?: string;
  file_data?: string;
}

/**
 * Define the expected structure for text message parts.
 */
interface ChatCompletionContentPartText {
  type: "text";
  text: string;
}

/**
 * Define the expected structure for file message parts.
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
 * 
 * Now accepts an additional parameter `previousQuestions` to steer the model away from repeating similar questions.
 */
export async function generateQuestion(
  prompt: string,
  context: string,
  fileInput?: FileInput,
  previousQuestions: string[] = [] // New parameter for already asked questions
): Promise<string> {
  try {
    // If there are previous questions, build a string that lists them.
    const previousContext =
      previousQuestions.length > 0
        ? "\nPreviously asked questions:\n" + previousQuestions.join("\n")
        : "";
    // Additional instruction for uniqueness.
    const differentiationInstruction =
      " Please ensure that the new question is unique and does not resemble any previously asked questions.";

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
            text: `Based on this prompt: "${prompt}" and previous answers: "${context}${previousContext}", generate a thought-provoking question.${differentiationInstruction}`,
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
            text: `Based on this prompt: "${prompt}" and previous answers: "${context}${previousContext}", generate a thought-provoking question.${differentiationInstruction}`,
          },
        ];
      } else {
        messageContent = `Based on this prompt: "${prompt}" and previous answers: "${context}${previousContext}", generate a thought-provoking question.${differentiationInstruction}`;
      }
    } else {
      messageContent = `Based on this prompt: "${prompt}" and previous answers: "${context}${previousContext}", generate a thought-provoking question.${differentiationInstruction}`;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o", // or use another model as needed
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
 * Optionally includes a file input.
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
