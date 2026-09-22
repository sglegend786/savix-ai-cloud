import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const callMistral = async (prompt) => {
  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    {
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content;
};

// ============================================================
// AI ELIGIBILITY ADVISOR
// ============================================================
export const analyzeEligibility = async (userProfile, scheme) => {
  const prompt = `
    You are an expert Government Scheme Advisor for India.
    Analyze if the user is eligible for the following scheme based on their profile.
    
    USER PROFILE:
    ${JSON.stringify(userProfile, null, 2)}
    
    SCHEME DETAILS:
    ${JSON.stringify(scheme, null, 2)}
    
    Return a JSON response (without markdown formatting or code blocks) exactly in this format:
    {
      "eligible": true/false,
      "reason": "Detailed explanation addressing why they are eligible or not, speaking directly to the user.",
      "missingDocuments": ["List any documents"]
    }
  `;

  try {
    let responseText = await callMistral(prompt);
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Mistral Eligibility Error:", error);
    return {
      eligible: false,
      reason: "Could not determine eligibility at this moment due to a technical error.",
      missingDocuments: []
    };
  }
};

// ============================================================
// AI CHATBOT
// ============================================================
export const chatWithAI = async (message, userProfile, language = 'en') => {
  const langMap = {
    'hi': 'Hindi', 'en': 'English', 'te': 'Telugu', 'ta': 'Tamil',
    'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'kn': 'Kannada',
    'ml': 'Malayalam', 'pa': 'Punjabi'
  };
  const targetLanguage = langMap[language] || 'English';

  const prompt = `
    You are 'SchemeSathi', a helpful and friendly AI assistant for Indian government schemes.
    The user is asking: "${message}"
    
    Here is the user's profile context:
    ${JSON.stringify(userProfile, null, 2)}
    
    Guidelines:
    - If they ask for schemes, suggest schemes relevant to their age, state, caste, and income.
    - Be concise and clear.
    - CRITICAL: You MUST reply in ${targetLanguage}.
  `;

  try {
    return await callMistral(prompt);
  } catch (error) {
    console.error("Mistral Chat Error:", error);
    return "I'm sorry, I am having trouble connecting to my database right now. Please try again later.";
  }
};

// ============================================================
// COMPARE SCHEMES
// ============================================================
export const compareSchemesAI = async (schemesList) => {
  const schemeKeys = schemesList.map((_, i) => `"scheme${i + 1}": "value for scheme ${i + 1}"`).join(", ");
  
  const prompt = `
    Compare the following government schemes and return a JSON array of objects representing rows in a comparison table.
    
    SCHEMES TO COMPARE:
    ${JSON.stringify(schemesList, null, 2)}
    
    Return ONLY a JSON response without markdown in this exact format:
    {
      "comparison": [
        { "feature": "Amount/Benefit", ${schemeKeys} },
        { "feature": "Income Limit", ${schemeKeys} },
        { "feature": "Last Date", ${schemeKeys} },
        { "feature": "Key Eligibility", ${schemeKeys} }
      ],
      "recommendation": "Brief sentence recommending the better option based on typical use cases."
    }
  `;

  try {
    let responseText = await callMistral(prompt);
    
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      responseText = responseText.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Mistral Compare Error:", error);
    throw new Error("Failed to compare schemes.");
  }
};
