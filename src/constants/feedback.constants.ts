export type Lang = "EN" | "HI";
export type FeedbackQType = "boolean" | "scale" | "text";

export interface FeedbackQ {
  key: string;
  type: FeedbackQType;
  prompt: Record<Lang, string>;
  when?: { if: string; equals: any };
  options?:  Record<Lang, { id: string; title: string }[]>;
}

export const FEEDBACK_SETS: Record<"NEST" | "FOOD" | "JOB" | "OVERALL", FeedbackQ[]> = {
  NEST: [
    {
      key: "nestIntro",
      type: "text",
      prompt: {
       EN: "👋 Hi! We’d love your feedback on your *Nest* stay. If you didn’t stay, just press No to exit.  If yes, press Yes to continue for feedback 🙂",
       HI: "👋 नमस्ते! हमें आपके *Nest* ठहराव पर आपका फ़ीडबैक चाहिए। अगर आपने ठहराव नहीं किया, तो बाहर निकलने के लिए 'नहीं' दबाएँ 🙂। अगर हाँ, तो 'हाँ' दबाएँ ताकि हम आपका फ़ीडबैक ले सकें",
      },
   options: {
        EN: [
          { id: "continue", title: "✅ Yes" },
          { id: "exit", title: "❌ No" },
        ],
        HI: [
          { id: "continue", title: "✅ हाँ" },
          { id: "exit", title: "❌ नहीं" },
        ],
      },
    },
    {
      key: "nestRating",
      type: "scale",
      prompt: {
        EN: "🏠 Please rate your stay from *0 (Poor)* to *10 (Excellent)* ⭐",
        HI: "🏠 कृपया अपने *Nest* ठहराव को *0 (बेकार)* से *10 (उत्कृष्ट)* तक रेट करें ⭐",
      },
    },
    {
      key: "nestBest",
      type: "text",
      prompt: {
        EN: "✨ What did you like the most about your stay?",
        HI: "✨ अपने ठहराव के दौरान आपको सबसे अच्छी चीज़ क्या लगी?",
      },
    },
    {
      key: "nestIssues",
      type: "text",
      prompt: {
        EN: "⚠️ What problems did you face or what can be improved?",
        HI: "⚠️ ठहराव के दौरान आपको क्या कठिनाई हुई या कहाँ सुधार हो सकता है?",
      },
    },
    {
      key: "nestRecommend",
      type: "boolean",
      prompt: {
        EN: "🤝 Would you recommend Nest to your family or friends?",
        HI: "🤝 क्या आप *Nest* को अपने दोस्तों या परिवार को सुझाएँगे?",
      },
     options: {
        EN: [
          { id: "continue", title: "✅ Yes" },
          { id: "exit", title: "❌ No" },
        ],
        HI: [
          { id: "continue", title: "✅ हाँ" },
          { id: "exit", title: "❌ नहीं" },
        ],
      },
    },
  ],
  FOOD: [
    {
      key: "foodIntro",
      type: "text",
      prompt: {
        EN: "👋 Hi! Did you use our *Curry food service*? If not, press No. If yes, press Yes to continue for feedback 🍛",
        HI: "👋 हाय! क्या आपने *Nest* में *Curry सेवा* का उपयोग किया था? अगर नहीं, तो 'नहीं' दबाएँ। अगर हाँ, तो 'हाँ' दबाएँ ताकि हम आपका फ़ीडबैक ले सकें 🍛",
      },
      options: {
        EN: [
          { id: "continue", title: "✅ Yes" },
          { id: "exit", title: "❌ No" },
        ],
        HI: [
          { id: "continue", title: "✅ हाँ" },
          { id: "exit", title: "❌ नहीं" },
        ],
      },
    },
    {
      key: "curryRating",
      type: "scale",
      when: { if: "foodIntro",equals: "continue"},
      prompt: {
        EN: "⭐ Please rate your food experience from *0 to 10*",
        HI: "⭐ कृपया अपने खाने के अनुभव को *0 से 10* तक रेट करें",
      },
    },
    {
      key: "curryBest",
      type: "text",
      when: { if: "foodIntro",equals: "continue" },
      prompt: {
        EN: "✨ What did you like the most about the food?",
        HI: "✨ खाने में आपको सबसे अच्छी चीज़ क्या लगी?",
      },
    },
    {
      key: "curryIssues",
      type: "text",
      when: { if: "foodIntro",equals: "continue" },
      prompt: {
        EN: "⚠️ What did you not like / what can we improve?",
        HI: "⚠️ खाने में आपको क्या पसंद नहीं आया या कहाँ सुधार हो सकता है?",
      },
    },
  ],
  JOB: [
    {
      key: "jobIntro",
      type: "text",
      prompt: {
        EN: "👋 Hi! Since you got job support from us, we’d like to know your experience 👷",
        HI: "👋 नमस्ते! आपको हमारी ओर से नौकरी मिली थी, उसका फ़ीडबैक चाहिए 👷",
      },
      options: {
        EN: [
          { id: "continue", title: "✅ Yes" },
          { id: "exit", title: "❌ No" },
        ],
        HI: [
          { id: "continue", title: "✅ हाँ" },
          { id: "exit", title: "❌ नहीं" },
        ],
      },
    },
    {
      key: "gotJob",
      type: "boolean",
      prompt: {
        EN: "💼 Did you get a job through us?",
        HI: "💼 क्या आपको हमारी ओर से नौकरी मिली थी?",
      },
      options: {
        EN: [
          { id: "continue", title: "✅ Yes" },
          { id: "exit", title: "❌ No" },
        ],
        HI: [
          { id: "continue", title: "✅ हाँ" },
          { id: "exit", title: "❌ नहीं" },
        ],
      },
    },
    {
      key: "jobRating",
      type: "scale",
      when: { if: "gotJob", equals: true },
      prompt: {
        EN: "⭐ Please rate your job experience from *0 to 10*",
        HI: "⭐ कृपया अपने नौकरी अनुभव को *0 से 10* तक रेट करें",
      },
    },
    {
      key: "jobBest",
      type: "text",
      when: { if: "gotJob", equals: true },
      prompt: {
        EN: "✨ In your current job, what do you like?",
        HI: "✨ अपनी अभी की नौकरी में आपको सबसे अच्छा क्या लगता है?",
      },
    },
    {
      key: "jobIssues",
      type: "text",
      when: { if: "gotJob", equals: true },
      prompt: {
        EN: "⚠️ Any challenges or support needed in your job?",
        HI: "⚠️ क्या नौकरी में कोई कठिनाई आ रही है या आपको अतिरिक्त सहायता चाहिए?",
      },
    },
  ],
  OVERALL: [
    {
      key: "overallIntro",
      type: "text",
      prompt: {
        EN: "🌐 Hi! We’d love your feedback on our *overall services*.",
        HI: "🌐 नमस्ते! हमें अपनी *संपूर्ण सेवाओं* पर आपका फ़ीडबैक चाहिए 🙂",
      },
      options: {
        EN: [
          { id: "continue", title: "✅ Yes" },
          { id: "exit", title: "❌ No" },
        ],
        HI: [
          { id: "continue", title: "✅ हाँ" },
          { id: "exit", title: "❌ नहीं" },
        ],
      },
    },
    {
      key: "overallRating",
      type: "scale",
      prompt: {
        EN: "⭐ Please rate NIA’s overall services from *0 to 10*",
        HI: "⭐ कृपया NIA की संपूर्ण सेवाओं को *0 से 10* तक रेट करें",
      },
    },
  ],
};



export function getQuestionsForType(type: "NEST" | "FOOD" | "JOB" | "OVERALL" | "ALL"): FeedbackQ[] {
  if (type === "ALL") {
    return [
      ...FEEDBACK_SETS.NEST,
      ...FEEDBACK_SETS.FOOD,
      ...FEEDBACK_SETS.JOB,
      ...FEEDBACK_SETS.OVERALL,
    ];
  }
  return FEEDBACK_SETS[type] || [];
}
