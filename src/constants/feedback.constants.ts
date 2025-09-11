export type Lang = "EN" | "HI";
export type FeedbackQType = "boolean" | "scale" | "text";

export interface FeedbackQ {
  key: string;
  type: FeedbackQType;
  prompt: Record<Lang, string>;
  when?: { if: string; equals: any };
  options?: { id: string; title: string }[]; // 👈 for buttons
}

export const FEEDBACK_SETS: Record<"NEST" | "FOOD" | "JOB" | "OVERALL", FeedbackQ[]> = {
  NEST: [
    {
      key: "nestIntro",
      type: "text",
      prompt: {
        EN: "👋 Hi! Since you stayed at *Nest*, we’d love a quick feedback.",
        HI: "👋 नमस्ते! आपने *Nest* में ठहराव किया था, उसी का छोटा सा feedback lena tha 🙂",
      },
      options: [
        { id: "continue", title: "✅ Yes" },
        { id: "exit", title: "🚪 No" },
      ],
    },
    {
      key: "nestRating",
      type: "scale",
      prompt: {
        EN: "🏠 Please rate your stay from *0 (Poor)* to *10 (Excellent)* ⭐",
        HI: "🏠 अपने Nest stay ko *0 (बेकार)* से *10 (बढ़िया)* tak rate karo ⭐",
      },
    },
    {
      key: "nestBest",
      type: "text",
      prompt: {
        EN: "✨ What did you like the most about your stay?",
        HI: "✨ Stay ke dauran aapko sabse *acchi cheez* kya lagi?",
      },
    },
    {
      key: "nestIssues",
      type: "text",
      prompt: {
        EN: "⚠️ What problems did you face or what can be improved?",
        HI: "⚠️ Stay ke dauran aapko kya dikkat hui ya kya sudhaar ho sakta hai?",
      },
    },
    {
      key: "nestRecommend",
      type: "boolean",
      prompt: {
        EN: "🤝 Would you recommend Nest to your family or friends?",
        HI: "🤝 Kya aap apne dost ya family ko Nest recommend karoge?",
      },
      options: [
        { id: "yes", title: "👍 Yes" },
        { id: "no", title: "👎 No" },
      ],
    },
  ],
  FOOD: [
    {
      key: "foodIntro",
      type: "text",
      prompt: {
        EN: "👋 Hi! Since you tried our *Curry food service*, we’d like your feedback 🍛",
        HI: "👋 Namaste! Aapne Nest mein *Curry service* use ki thi, uska chhota feedback lena tha 🍛",
      },
      options: [
        { id: "continue", title: "✅ Yes" },
        { id: "exit", title: "🚪 No" },
      ],
    },
    {
      key: "curryUser",
      type: "boolean",
      prompt: {
        EN: "🍛 Did you use our Curry service?",
        HI: "🍛 Kya aapne humari Curry service ka use kiya?",
      },
      options: [
        { id: "yes", title: "👍 Yes" },
        { id: "no", title: "👎 No" },
      ],
    },
    {
      key: "curryRating",
      type: "scale",
      when: { if: "curryUser", equals: true },
      prompt: {
        EN: "⭐ Please rate your food experience from *0 to 10*",
        HI: "⭐ Apne khane ka experience *0 se 10* tak rate karo",
      },
    },
    {
      key: "curryBest",
      type: "text",
      when: { if: "curryUser", equals: true },
      prompt: {
        EN: "✨ What did you like the most about the food?",
        HI: "✨ Khane mein sabse acchi cheez kya lagi?",
      },
    },
    {
      key: "curryIssues",
      type: "text",
      when: { if: "curryUser", equals: true },
      prompt: {
        EN: "⚠️ What did you not like / what can we improve?",
        HI: "⚠️ Khane mein kya pasand nahi aaya ya aur kya sudhaar ho sakta hai?",
      },
    },
  ],
  JOB: [
    {
      key: "jobIntro",
      type: "text",
      prompt: {
        EN: "👋 Hi! Since you got job support from us, we’d like to know your experience 👷",
        HI: "👋 Namaste! Aapko humari taraf se job mila tha, uska feedback lena tha 👷",
      },
      options: [
        { id: "continue", title: "✅ Yes" },
        { id: "exit", title: "🚪 No" },
      ],
    },
    {
      key: "gotJob",
      type: "boolean",
      prompt: {
        EN: "💼 Did you get a job through us?",
        HI: "💼 Kya aapko job humari taraf se mila tha?",
      },
      options: [
        { id: "yes", title: "👍 Yes" },
        { id: "no", title: "👎 No" },
      ],
    },
    {
      key: "jobRating",
      type: "scale",
      when: { if: "gotJob", equals: true },
      prompt: {
        EN: "⭐ Please rate your job experience from *0 to 10*",
        HI: "⭐ Apne job experience ko *0 se 10* tak rate karo",
      },
    },
    {
      key: "jobBest",
      type: "text",
      when: { if: "gotJob", equals: true },
      prompt: {
        EN: "✨ What do you like the most in your job?",
        HI: "✨ Job mein aapko sabse accha kya lag raha hai?",
      },
    },
    {
      key: "jobIssues",
      type: "text",
      when: { if: "gotJob", equals: true },
      prompt: {
        EN: "⚠️ Any challenges or support needed in your job?",
        HI: "⚠️ Kya job mein koi dikkat aa rahi hai ya aapko extra support chahiye?",
      },
    },
  ],
  OVERALL: [
    {
      key: "overallIntro",
      type: "text",
      prompt: {
        EN: "🌐 Hi! We’d love your feedback on our *overall services*.",
        HI: "🌐 Namaste! Humein apni *overall services* par aapka feedback chahiye 🙂",
      },
      options: [
        { id: "continue", title: "✅ Yes" },
        { id: "exit", title: "🚪 No" },
      ],
    },
    {
      key: "overallRating",
      type: "scale",
      prompt: {
        EN: "⭐ Please rate NIA’s overall services from *0 to 10*",
        HI: "⭐ Aap NIA ki overall services ko *0 se 10* tak rate karoge?",
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
