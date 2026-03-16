const API_BASE = '/api/ai';

export interface EmailSummary {
  title: string;
  overview: string;
  steps: string[];
  suggestedReply: string;
}

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
"suggestedReply": A professional, polite email reply draft from ${userName} to ${senderName}.

Do not include any extra conversational text or markdown code blocks outside the JSON.`;

    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        responseSchema: {
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
        }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return JSON.parse(data.text || "{}") as EmailSummary;
  } catch (error) {
    console.error("Error summarizing email:", error);
    return {
      title: `Follow up: ${subject}`,
      overview: "Failed to generate AI summary.",
      steps: ["Review email and take necessary action."],
      suggestedReply: `Dear ${senderName.split(' ')[0]},\n\nThank you for your email. I have received it and will get back to you shortly.\n\nRegards,\n${userName.split(' ')[0]}`
    };
  }
};

export const improveDraft = async (subject: string, body: string): Promise<{ subject: string, body: string }> => {
  try {
    const prompt = body.trim()
      ? `Please rephrase and improve the following email draft to be more professional and clear. Return a JSON object with two keys: "subject" (a concise, professional subject line) and "body" (the improved email body in HTML format, using <p>, <br>, <strong> etc. for formatting). Do not include any extra conversational text or markdown code blocks outside the JSON.\n\nOriginal Subject: ${subject}\nOriginal Body: ${body}`
      : `Please write a professional email draft based on the subject: "${subject}". Return a JSON object with two keys: "subject" (a concise, professional subject line) and "body" (the email body in HTML format, using <p>, <br>, <strong> etc. for formatting). Do not include any extra conversational text or markdown code blocks outside the JSON.`;

    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            subject: { type: 'STRING' },
            body: { type: 'STRING' }
          },
          required: ["subject", "body"]
        }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return JSON.parse(data.text || "{}");
  } catch (error) {
    console.error("Error improving draft:", error);
    return { subject, body };
  }
};
