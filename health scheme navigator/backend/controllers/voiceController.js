import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const parseVoiceIntent = async (req, res) => {
  try {
    const { transcript, currentUrl, contextData, conversationHistory } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ success: false, message: "Transcript is required" });
    }

    const prompt = `
      You are the core intelligence of "SchemeSathi VoiceOS", an AI assistant that controls a web application.
      Your job is to read the user's voice transcript and map it to a specific command intent.
      
      User's Transcript: "${transcript}"
      Conversation History: ${JSON.stringify(conversationHistory || [])}
      Current Page URL: "${currentUrl}"
      Current Page Context (if any): ${JSON.stringify(contextData || {})}

      You MUST respond with a RAW JSON object.
      The JSON object must have the following schema:
      {
        "action": "NAVIGATE" | "SEARCH" | "SCROLL" | "ACCESSIBILITY" | "EXPLAIN" | "SPEAK" | "UNKNOWN" | "AUTO_COMPARE" | "INTERACTIVE_SEARCH",
        "target": "URL path if action is NAVIGATE",
        "query": "Search query or comma-separated scheme names if action is SEARCH or AUTO_COMPARE",
        "direction": "up | down | top | bottom if action is SCROLL",
        "command": "dark_mode | light_mode | font_increase | font_decrease | high_contrast if action is ACCESSIBILITY",
        "reply": "A natural, helpful text response to speak out loud to the user (in the language they spoke).",
        "language": "ISO 639-1 code of the detected language (MUST be EXACTLY 'hi' for Hindi, 'mr' for Marathi, 'en' for English, 'bn', 'gu', 'ta', etc).",
        "filters": {
           "category": "string (e.g. 'Women', 'Senior Citizen', 'Minority')",
           "state": "string",
           "isStudent": "boolean",
           "isFarmer": "boolean",
           "gender": "Male | Female",
           "age": "number (if they mention senior citizen, set to 65)"
        }
      }
      
      Rules:
      - If they ask to "Compare X and Y" -> action is AUTO_COMPARE and set 'query' to "X, Y". If they just say "Compare schemes" without naming them, action is INTERACTIVE_COMPARE, target is "/compare", and reply asks them which schemes they want to compare.
      - If the user is answering a previous question about which schemes to compare OR if the Current Page URL is "/compare" and they just say scheme names, you MUST set action to AUTO_COMPARE and set 'query' to the scheme names they mentioned. Do NOT set action to SPEAK.
      - If they ask for "schemes for women" or "senior citizen schemes" -> action is SEARCH and set the appropriate 'filters' (like gender: Female, or category: Women/Senior Citizen).
      - If they ask to "find schemes for me" -> action is INTERACTIVE_SEARCH, target is "/find-schemes", and set 'reply' to ask them for missing info.
      - If the user is answering a previous question about finding schemes, extract filters. If you still need more info, keep action as INTERACTIVE_SEARCH, target as "/find-schemes", and ask the next question in 'reply', returning the collected 'filters' so far. If you have enough info, action is SEARCH with 'filters'.
      - If they ask to "Open home" -> action is NAVIGATE, target is "/"
      - Always include the 'reply' field in the same language the user spoke. Never ask "Would you like to compare them?", just execute the action.
    `;

    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const jsonText = response.data.choices[0].message.content;
    const intent = JSON.parse(jsonText);
    res.status(200).json({ success: true, intent });

  } catch (error) {
    console.error("Voice Intent Error:", error);
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      return res.status(200).json({
        success: true,
        intent: {
          action: "SPEAK",
          reply: "I am receiving too many requests. Please wait a few seconds and try again."
        }
      });
    }
    res.status(500).json({ success: false, message: "Failed to parse intent", error: error.message });
  }
};
