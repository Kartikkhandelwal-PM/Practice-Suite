import { aiApi } from '../lib/api';

export interface EmailSummary {
  title: string;
  overview: string;
  steps: string[];
  suggestedReply: string;
}

export const checkAiStatus = async (): Promise<{ configured: boolean, model: string, key_source?: string }> => {
  try {
    return await aiApi.status();
  } catch (error) {
    console.error("Error checking AI status:", error);
    return { configured: false, model: "unknown" };
  }
};

export const summarizeEmail = async (subject: string, body: string, senderName: string, userName: string): Promise<EmailSummary> => {
  try {
    const prompt = `Analyze the following email and provide a summary, action steps, and a suggested professional reply.
Sender: ${senderName}
User: ${userName}
Subject: ${subject}
Body: ${body}

Return a JSON object with the following keys:
"title": A concise task title based on the email (e.g., "Process TDS for Client X").
"overview": A brief 1-2 sentence summary of the email's content.
"steps": An array of 3-5 specific action items derived from the email.
"suggestedReply": A professional, polite email reply draft from ${userName} to ${senderName}. The reply should be well-structured with proper greetings, clear paragraphs, and a professional sign-off. Use HTML tags like <p> and <br> for formatting.

Do not include any extra conversational text or markdown code blocks outside the JSON.`;

    const data = await aiApi.generate(prompt, {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        overview: { type: 'STRING' },
        steps: {
          type: 'ARRAY',
          items: { type: 'STRING' }
        },
        suggestedReply: { type: 'STRING' }
      },
      required: ["title", "overview", "steps", "suggestedReply"]
    });
    
    if (!data.text) {
      console.error("AI API returned empty text");
      throw new Error("Empty AI response");
    }

    // Strip markdown code blocks if present
    let cleanText = data.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/m, '').trim();
    }

    try {
      return JSON.parse(cleanText) as EmailSummary;
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", cleanText);
      throw new Error("Invalid AI response format");
    }
  } catch (error: any) {
    console.error("Error summarizing email:", error);
    const firstName = (senderName || 'Sender').split(' ')[0];
    const userFirstName = (userName || 'User').split(' ')[0];
    return {
      title: `Follow up: ${subject || 'Email'}`,
      overview: error.message || "AI summary unavailable.",
      steps: ["Review email and take necessary action."],
      suggestedReply: `Dear ${firstName},\n\nThank you for your email. I have received it and will get back to you shortly.\n\nRegards,\n${userFirstName}`
    };
  }
};

export const improveDraft = async (subject: string, body: string): Promise<{ subject: string, body: string }> => {
  try {
    const prompt = body.trim()
      ? `Please rephrase and improve the following email draft to be more professional and clear. Return a JSON object with two keys: "subject" (a concise, professional subject line) and "body" (the improved email body in HTML format, using <p>, <br>, <strong> etc. for formatting). Do not include any extra conversational text or markdown code blocks outside the JSON.\n\nOriginal Subject: ${subject}\nOriginal Body: ${body}`
      : `Please write a professional email draft based on the subject: "${subject}". Return a JSON object with two keys: "subject" (a concise, professional subject line) and "body" (the email body in HTML format, using <p>, <br>, <strong> etc. for formatting). Do not include any extra conversational text or markdown code blocks outside the JSON.`;

    const data = await aiApi.generate(prompt, {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING' },
        body: { type: 'STRING' }
      },
      required: ["subject", "body"]
    });
    
    if (!data.text) {
      console.error("AI API returned empty text (Draft)");
      throw new Error("Empty AI response");
    }

    // Strip markdown code blocks if present
    let cleanText = data.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/m, '').trim();
    }

    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse AI JSON (Draft):", cleanText);
      throw new Error("Invalid AI response format");
    }
  } catch (error: any) {
    console.error("Error improving draft:", error);
    return { 
      subject: subject, 
      body: body + `<br><br><div style="color: #d9534f; font-size: 12px; border: 1px solid #f2dede; padding: 8px; border-radius: 4px; background: #fcf8e3;"><strong>AI Error:</strong> ${error.message || 'Failed to generate draft.'}</div>` 
    };
  }
};
