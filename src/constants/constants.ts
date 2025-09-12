const keyLabels: Record<
  "EN" | "HI",
  Record<string, string>
> = {
  EN: {
    full_name: "name",
    age: "age",
    residence_city: "city",
    job_preference_city: "city",
  },
  HI: {
    full_name: "नाम",
    age: "उम्र",
    residence_city: "शहर",
    job_preference_city: "शहर",
  },
};

export const errorMessages: Record<"EN" | "HI", (key: string, value?: string) => string> = {
  EN: (key: string, value?: string) => {
    const label = keyLabels.EN[key] ?? key;
    if (key === "age") {
      return `❌ Sorry, you’re not eligible based on the age provided. 🙏 
👉 Press *R* to reset and try again.`;
    }
    return `🤔 That doesn't look like a valid *${label}*. Could you try again?  
👉 Or press *R* to reset and start fresh.`;
  },

  HI: (key: string, value?: string) => {
    const label = keyLabels.HI[key] ?? key;
    if (key === "age") {
      return `❌ माफ़ कीजिए, दी गई उम्र के आधार पर आप इस नौकरी के लिए योग्य नहीं हैं। 🙏  
👉 रीसेट करने और दोबारा शुरू करने के लिए *R* दबाएँ।`;
    }
    return `🤔 यह सही *${label}* नहीं लग रहा। कृपया फिर से बताइए।  
👉 रीसेट करने और दोबारा शुरू करने के लिए *R* दबाएँ।`;
  },
};


export const roleMessages: Record<"EN" | "HI", (roles: string[]) => string> = {
  EN: (roles) => {
    const emojiNums = [
      "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟",
      "⓫", "⓬", "⓭", "⓮", "⓯", "⓰", "⓱", "⓲", "⓳", "⓴",
      "㉑", "㉒", "㉓", "㉔", "㉕", "㉖", "㉗", "㉘", "㉙", "㉚"
    ];

    const roleIcons: Record<string, string> = {
      "ASM": "🏢",
      "Callers": "📞",
      "Client Relation Executive": "🤝",
      "Complaince": "📋",
      "CSO (Chief Sales Officer)": "🎯",
      "Delivery Executive": "🚚",
      "Driver": "🚕",
      "Driver cum Delivery Associate": "🚐",
      "Field Operation Executive": "🌍",
      "Field Operation Supervisor": "🧭",
      "Loader": "💪",
      "Merchant onboarding": "🛒",
      "Operators": "⚙️",
      "Picker/Packer": "📦",
      "Process Associate": "📝",
      "Sales Executive": "💼",
      "Sales Team": "👥",
      "Sourcing Executive/ Operations Executive": "🛠️",
      "Supervisor": "👨‍💼",
      "Supply Executive": "🚛",
      "Van Associate": "🚐",
      "Verification Specialist": "✅",
    };

    return `🌟 *Exciting Job Categories Await You!* 🌟\n\n${roles
      .map((cat, i) => `${emojiNums[i] || `${i + 1}`}  ${roleIcons[cat] || "✨"} *${cat}*`) 
      .join("\n")}\n\n👉 Reply with the job *number* to apply or know more! 🚀`;
  },

  HI: (roles) => {
    const emojiNums = [
       "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟",
      "⓫", "⓬", "⓭", "⓮", "⓯", "⓰", "⓱", "⓲", "⓳", "⓴",
      "㉑", "㉒", "㉓", "㉔", "㉕", "㉖", "㉗", "㉘", "㉙", "㉚"
    ];

    const roleIcons: Record<string, string> = {
      "ASM": "🏢",
      "Callers": "📞",
      "Client Relation Executive": "🤝",
      "Complaince": "📋",
      "CSO (Chief Sales Officer)": "🎯",
      "Delivery Executive": "🚚",
      "Driver": "🚕",
      "Driver cum Delivery Associate": "🚐",
      "Field Operation Executive": "🌍",
      "Field Operation Supervisor": "🧭",
      "Loader": "💪",
      "Merchant onboarding": "🛒",
      "Operators": "⚙️",
      "Picker/Packer": "📦",
      "Process Associate": "📝",
      "Sales Executive": "💼",
      "Sales Team": "👥",
      "Sourcing Executive/ Operations Executive": "🛠️",
      "Supervisor": "👨‍💼",
      "Supply Executive": "🚛",
      "Van Associate": "🚐",
      "Verification Specialist": "✅",
    };

    return `🌟 *उपलब्ध नौकरी की श्रेणियाँ* 🌟\n\n${roles
      .map((cat, i) => `${emojiNums[i] || `${i + 1}`}  ${roleIcons[cat] || "✨"} *${cat}*`) // 👈 added 2 spaces after emoji
      .join("\n")}\n\n👉 कृपया नौकरी का *नंबर* बताइए जिसमें आप रुचि रखते हैं। 🚀`;
  },
};

const numberEmojis = [
  "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟",
  "⓫", "⓬", "⓭", "⓮", "⓯", "⓰", "⓱", "⓲", "⓳", "⓴"
];
export const jobsMessage: Record<"EN" | "HI", (jobs: any[]) => string> = {
  EN: (jobs) =>
    `🎯 Great news! We found ${jobs.length} jobs for you:\n\n${jobs
      .map((job, i) => {
        const cleanSalary = job.salary
          .replace(/CTC\s*(\d+)/gi, "Salary ₹ $1")
          .replace(/Inhand\s*(\d+)/gi, "Inhand ₹ $1");
        return `${numberEmojis[i]}  *${job.role}* – 💰 ${cleanSalary}\n📍 ${job.city}${
          job?.locality ? `, ${job.locality}` : ""
        }\n`;
      })
      .join("\n")}\n👉Tap a button below to apply or decline.`,

  HI: (jobs) =>
    `🎯 शानदार खबर! आपके लिए ${jobs.length} jobs मिली हैं:\n\n${jobs
      .map((job, i) => {
        const cleanSalary = job.salary
          .replace(/CTC\s*(\d+)/gi, "Salary ₹ $1")
          .replace(/Inhand\s*(\d+)/gi, "Inhand ₹ $1");
        return `${numberEmojis[i]}  *${job.role}* – 💰 ${cleanSalary}\n📍 ${job.city}${
          job?.locality ? `, ${job.locality}` : ""
        }\n`;
      })
      .join("\n")}\n👉 नीचे दिए गए बटन पर टैप करें, या 🚫 चुनें यदि रुचि नहीं है।`,
};




export const roleKeys: Record<string, string[]> = {
  "Delivery Executive": ["MCWG_License", "Driving_License", "Bike_Owner"],
  "Driver cum Delivery Associate": ["3WTR_License", "Driving_Exp", "Aadhar_OTP"],
  Driver: ["License_3yr"],
  "Picker/Packer": ["Read_English"],
  Loader: ["Male_Gender"],
  "Van Associate": ["Male_Gender"],
  Supervisor: ["Exp_Ecom_3yr", "Computer_Excel", "Education_12th"],
  "Process Associate": ["Exp_Ecom", "Computer_Excel", "Education_12th"],
  "Sourcing Executive/ Operations Executive": [
    "Exp_Sourcing",
    "Vendor_Negotiation",
    "Logistics_Knowledge",
    "Crisis_Management",
    "RFQ_Billing"
  ],
  ASM: ["Education_10th12th", "Exp_FMCG"],
  "CSO (Chief Sales Officer)": ["Education_10th", "Exp_FMCG_1to2yr", "Eng_ReadSpeak"],
  "Sales Executive": ["Onboard_3captains"],
  Callers: ["Education_10th12th", "Work_Exp"],
  "Sales Team": ["Exp_FieldSales", "Target_Comfort"],
  "Merchant Onboarding": ["Exp_Onboarding", "Digital_Tools"],
  "Verification Specialist": ["Exp_KYC", "Data_Security"],
  Complaince: ["Compliance_Awareness", "Exp_Audit"],
  Operators: ["Education_ITI"],
  "Supply Executive": [
    "Excel_Proficiency",
    "Comm_Skills",
    "Target_Work",
    "Coordination",
    "Problem_Solving",
    "Mentor_Fleet",
    "Negotiation"
  ],
  "Client Relation Executive": [
    "Comm_Skills",
    "Eng_ReadWrite",
    "Excel_Basic",
    "Smartphone_Owner",
    "Bike_License"
  ],
  "Field Operation Executive": [
    "Comm_Skills",
    "Eng_ReadWrite",
    "Excel_Basic",
    "Smartphone_Owner",
    "Bike_License",
    "Lead_Conversion"
  ],
  "Field Operation Supervisor": [
    "Comm_Skills",
    "Eng_ReadWrite",
    "Excel_Basic",
    "Smartphone_Owner",
    "Bike_License"
  ],
};


export const roleKeysMapping: Record<string, { EN: string; HI: string }> = {
  Driving_License: {
    EN: "🚗 Do you have driving licence? 🙂 | ☺️ Got your driving licence with you? 📃",
    HI: "🚗 क्या आपके पास ड्राइविंग लाइसेंस है? 🙂 | ☺️ आपका लाइसेंस बना है क्या? 📃",
  },

   MCWG_License: {
    EN: "🏍️ Do you have MCWG licence? 🙂 | ☺️ MCWG licence with you? 📃",
    HI: "🏍️ क्या आपके पास MCWG लाइसेंस है? 🙂 | ☺️ MCWG लाइसेंस बना है क्या? 📃",
  },
  Bike_Owner: {
    EN: "🛵 Do you own a bike? 🙂 | ☺️ Got your own bike? 🚲",
    HI: "🛵 क्या आपके पास अपनी बाइक है? 🙂 | ☺️ अपनी बाइक रखते हो क्या? 🚲",
  },
  "3WTR_License": {
    EN: "🚐 Do you have 3W-TR licence? 🙂 | ☺️ 3W-TR licence with you? 📃",
    HI: "🚐 3W-TR लाइसेंस है क्या? 🙂 | ☺️ 3W-TR लाइसेंस बना है क्या? 📃",
  },
Driving_Exp: {
    EN: "🚗 3+ years driving experience? 🙂 | ☺️ Do you have 3+ years of driving experience? 🕒",
    HI: "🚗क्या आपके पास 3+ साल का ड्राइविंग अनुभव है? 🙂 | ☺️ ड्राइविंग का 3 साल का अनुभव है? 🕒",
  },

Aadhar_OTP: {
    EN: "📲 Can you do Aadhaar OTP? 🙂 | ☺️ Aadhaar OTP handle kar loge? ✅",
    HI: "📲 क्या आप आधार OTP कर सकते हो? 🙂 | ☺️ आधार OTP वेरिफिकेशन हो पाएगा? ✅",
  },
  License_3yr: {
    EN: "🗓️ Licence 3+ years old? 🙂 | ☺️ Your DL made 3 yrs back? 🚘",
    HI: "🗓️ लाइसेंस 3 साल पुराना है? 🙂 | ☺️ लाइसेंस 3+ साल पहले बना था? 🚘",
  },
  Read_English: {
    EN: "📖 Can you read English? 🙂 | ☺️ English padh sakte ho? ✅",
    HI: "📖 क्या आप इंग्लिश पढ़ सकते हो? 🙂 | ☺️ आपको इंग्लिश समझ आती है? ✅",
  },
Male_Gender: {
  EN: "👨 Are you male? 🙂 | ☺️ Please confirm if you are male ✅",
  HI: "👨 क्या आप पुरुष हैं? 🙂 | ☺️ कृपया बताइए, आप पुरुष हैं? ✅",
},
 Exp_Ecom_3yr: {
    EN: "📦 3+ years in eCommerce? 🙂 | ☺️ Worked 3 yrs in eCom? 💻",
    HI: "📦 आपने ईकॉमर्स में 3+ साल काम किया है? 🙂 | ☺️ ईकॉमर्स का 3 साल का अनुभव है क्या? 💻",
  },
  Computer_Excel: {
    EN: "💻 Can you use Excel? 🙂 | ☺️ Comfortable with computer & Excel? 📊",
    HI: "💻 आपको एक्सेल चलाना आता है? 🙂 | ☺️ कंप्यूटर/एक्सेल इस्तेमाल कर सकते हो? 📊",
  },

  Education_12th: {
    EN: "🎓 Are you 12th pass? 🙂 | ☺️ Finished 12th class? ✅",
    HI: "🎓 क्या आप 12वीं पास हो? 🙂 | ☺️ 12वीं पूरी की है क्या? ✅",
  },

  Exp_Ecom: {
    EN: "📦 Worked in eCommerce before? 🙂 | ☺️ Do you have eCom experience? ✅",
    HI: "📦 आपने ईकॉमर्स में काम किया है? 🙂 | ☺️ ईकॉमर्स का अनुभव है क्या? ✅",
  },

  Exp_Sourcing: {
    EN: "🚚 2–4 yrs in sourcing? 🙂 | ☺️ Worked in vendor/vehicle sourcing? 📋",
    HI: "🚚 2–4 साल सोर्सिंग का अनुभव है? 🙂 | ☺️ वेंडर/वाहन सोर्सिंग किया है? 📋",
  },
 Vendor_Negotiation: {
    EN: "🤝 Are you good at vendor talks? 🙂 | ☺️ Can you do vendor negotiation? ✅",
    HI: "🤝 वेंडर से बात करना आता है? 🙂 | ☺️ आप नेगोशिएशन कर सकते हो क्या? ✅",
  },

  Logistics_Knowledge: {
    EN: "🗺️ Know city routes & markets? 🙂 | ☺️ Aware of logistics platforms? 🚦",
    HI: "🗺️ आपको शहर के रास्ते आते हैं? 🙂 | ☺️ लॉजिस्टिक्स/मार्केट का ज्ञान है? 🚦",
  },
  Crisis_Management: {
    EN: "🔥 Can you handle problems? 🙂 | ☺️ Good at last-minute fixes? 💪",
    HI: "🔥 मुश्किल में काम संभाल सकते हो? 🙂 | ☺️ जल्दी प्रॉब्लम सॉल्व कर सकते हो? 💪",
  },
  RFQ_Billing: {
    EN: "🧾 Done RFQ & billing work? 🙂 | ☺️ Have experience in vendor billing? 📊",
    HI: "🧾 RFQ/बिलिंग का काम किया है? 🙂 | ☺️ वेंडर बिलिंग का अनुभव है? 📊",
  },

  Education_10th12th: {
    EN: "🎓 10th/12th pass? 🙂 | ☺️ School till 10th/12th done? ✅",
    HI: "🎓 आप 10वीं/12वीं पास हो? 🙂 | ☺️ स्कूलिंग 10वीं/12वीं तक की है? ✅",
  },
  Exp_FMCG: {
    EN: "🛒 Have FMCG experience? 🙂 | ☺️ Worked in FMCG before? ✅",
    HI: "🛒 आपने FMCG में काम किया है? 🙂 | ☺️ FMCG का अनुभव है क्या? ✅",
  },
  Exp_FMCG_1to2yr: {
  EN: "🛍️ 1–2 yrs FMCG experience? 🙂 | ☺️ Worked 1–2 yrs in FMCG? ✅",
  HI: "🛍️ आपके पास 1–2 साल FMCG का अनुभव है? 🙂 | ☺️ FMCG में 1–2 साल काम किया है? ✅",
  },
  Eng_ReadSpeak: {
  EN: "📖🗣️ Can you read & speak English? 🙂 | ☺️ English bolna/padhna aata hai? ✅",
  HI: "📖🗣️ क्या आप इंग्लिश पढ़ और बोल सकते हो? 🙂 | ☺️ इंग्लिश आपको आती है क्या? ✅",
 },
Onboard_3captains: {
  EN: "🛵🚕 Can you bring 3 captains weekly? 🙂 | ☺️ Onboard 3+ riders in 1 week? 💪",
  HI: "🛵🚕 क्या आप 1 हफ्ते में 3 कैप्टन ला सकते हो? 🙂 | ☺️ हफ्ते में 3+ राइडर ऑनबोर्ड करोगे? 💪",
},
Work_Exp: {
  EN: "🧑‍💼 Do you have work experience? 🙂 | ☺️ Worked anywhere before? ✅",
  HI: "🧑‍💼 क्या आपने पहले कहीं काम किया है? 🙂 | ☺️ वर्क एक्सपीरियंस है क्या? ✅",
},

Exp_FieldSales: {
  EN: "🚶‍♂️ Field sales experience? 🙂 | ☺️ Worked in field sales before? 💼",
  HI: "🚶‍♂️ क्या आपको फील्ड सेल्स का अनुभव है? 🙂 | ☺️ फील्ड सेल्स का काम किया है क्या? 💼",
},

Target_Comfort: {
  EN: "🎯 Okay with sales targets? 🙂 | ☺️ Daily/weekly targets fine? ✅",
  HI: "🎯 क्या आप टारगेट्स के साथ ठीक हो? 🙂 | ☺️ रोज/साप्ताहिक टारगेट पूरा कर लोगे? ✅",
},

Exp_Onboarding: {
  EN: "🛒 Done vendor onboarding work? 🙂 | ☺️ Have merchant onboarding exp? ✅",
  HI: "🛒 क्या आपने वेंडर ऑनबोर्डिंग किया है? 🙂 | ☺️ मर्चेंट ऑनबोर्डिंग का अनुभव है? ✅",
},

Digital_Tools: {
  EN: "📲 Can you use apps for work? 🙂 | ☺️ Comfortable with digital tools? 💻",
  HI: "📲 क्या आप मोबाइल ऐप्स इस्तेमाल कर सकते हो? 🙂 | ☺️ डिजिटल टूल्स इस्तेमाल कर लोगे? 💻",
},

Exp_KYC: {
  EN: "📝 Done KYC/document checks? 🙂 | ☺️ Have KYC verification exp? ✅",
  HI: "📝 क्या आपने KYC/डॉक्यूमेंट्स वेरिफाई किया है? 🙂 | ☺️ KYC का अनुभव है क्या? ✅",
},

Data_Security: {
  EN: "🔒 Okay handling customer data? 🙂 | ☺️ Comfortable with sensitive info? 📂",
  HI: "🔒 क्या आप ग्राहक डेटा संभाल सकते हो? 🙂 | ☺️ संवेदनशील जानकारी संभाल लोगे? 📂",
},

Compliance_Awareness: {
  EN: "⚖️ Do you know compliance rules? 🙂 | ☺️ Aware of basic regulations? 📋",
  HI: "⚖️ क्या आपको नियम/रेगुलेशन का ज्ञान है? 🙂 | ☺️ बेसिक कंप्लायंस रूल्स जानते हो? 📋",
},

Exp_Audit: {
  EN: "🧐 Done audit checks before? 🙂 | ☺️ Have compliance/audit exp? 📑",
  HI: "🧐 क्या आपने ऑडिट/कंप्लायंस का काम किया है? 🙂 | ☺️ ऑडिट का अनुभव है क्या? 📑",
},

Education_ITI: {
  EN: "🔧 Completed ITI course? 🙂 | ☺️ Are you ITI qualified? 🎓",
  HI: "🔧 क्या आपने ITI कोर्स पूरा किया है? 🙂 | ☺️ आप ITI पास हो क्या? 🎓",
},

Excel_Proficiency: {
  EN: "📊 Good with MS Excel? 🙂 | ☺️ Can handle Excel & data? ✅",
  HI: "📊 क्या आप Excel में अच्छे हो? 🙂 | ☺️ Excel और डेटा संभाल सकते हो? ✅",
},

Comm_Skills: {
  EN: "🗣️ Do you have good communication? 🙂 | ☺️ Are you clear in talking? ✅",
  HI: "🗣️ क्या आपकी कम्युनिकेशन अच्छी है? 🙂 | ☺️ बात स्पष्ट तरीके से कर सकते हो? ✅",
},

Target_Work: {
  EN: "🎯 Okay working with targets? 🙂 | ☺️ Can manage goal-based work? ✅",
  HI: "🎯 क्या आप टारगेट के साथ काम कर सकते हो? 🙂 | ☺️ गोल-बेस्ड काम कर सकते हो? ✅",
},

Coordination: {
  EN: "🤝 Are you good at teamwork? 🙂 | ☺️ Can you coordinate well? ✅",
  HI: "🤝 क्या आप टीम के साथ अच्छा काम कर सकते हो? 🙂 | ☺️ कोऑर्डिनेशन कर सकते हो? ✅",
},

Problem_Solving: {
  EN: "🧠 Can you solve problems fast? 🙂 | ☺️ Are you good in thinking? ✅",
  HI: "🧠 क्या आप समस्याओं को जल्दी हल कर सकते हो? 🙂 | ☺️ सोच-समझकर काम कर सकते हो? ✅",
},

Mentor_Fleet: {
  EN: "🚚 Can you train fleet staff? 🙂 | ☺️ Able to mentor operations team? 💪",
  HI: "🚚 क्या आप फ्लिट स्टाफ को ट्रेन कर सकते हो? 🙂 | ☺️ ऑपरेशंस टीम को गाइड कर लोगे? 💪",
},

Negotiation: {
  EN: "👥 Good at negotiation? 🙂 | ☺️ Can manage people talks? ✅",
  HI: "👥 क्या आप नेगोशिएशन कर सकते हो? 🙂 | ☺️ लोगों को मैनेज कर सकते हो? ✅",
},

Eng_ReadWrite: {
  EN: "📖✍️ Can you read & write English? 🙂 | ☺️ Basic English reading/writing ok? ✅",
  HI: "📖✍️ क्या आप इंग्लिश पढ़ और लिख सकते हो? 🙂 | ☺️ बेसिक इंग्लिश लिखना/पढ़ना आता है? ✅",
},

Excel_Basic: {
  EN: "📊 Do you know basic Excel? 🙂 | ☺️ Comfortable with simple Excel? ✅",
  HI: "📊 क्या आपको Excel के बेसिक आते हैं? 🙂 | ☺️ सिंपल Excel का काम कर सकते हो? ✅",
},

Smartphone_Owner: {
  EN: "📱 Do you have a smartphone? 🙂 | ☺️ Got smartphone with you? 📲",
  HI: "📱 क्या आपके पास स्मार्टफोन है? 🙂 | ☺️ स्मार्टफोन इस्तेमाल करते हो क्या? 📲",
},

Bike_License: {
  EN: "🛵 Do you have bike + licence? 🙂 | ☺️ Bike with DL available? ✅",
  HI: "🛵 क्या आपके पास बाइक + लाइसेंस है? 🙂 | ☺️ बाइक और DL दोनों है क्या? ✅",
},

Lead_Conversion: {
  EN: "🏡👉💰 Can you convert leads to sales? 🙂 | ☺️ Able to close deals? 🔥",
  HI: "🏡👉💰 क्या आप साइट विज़िट लीड्स को सेल्स में बदल सकते हो? 🙂 | ☺️ डील्स क्लोज कर लोगे क्या? 🔥",
},

};
export const commonKeys = [
  "full_name",
  "age",
  "residence_city",
  "job_preference_city",
];

export const commonKeysMapping: Record<string, { EN: string; HI: string }> = {
  full_name: {
    EN:
      "Heyy 🤗!! What’s your  name ? 📱 | " +
      "Hi 👋 Can you tell me your  name ? | " +
      "Hello 👋, please share your  name  🙂 | ",

    HI:
      "नमस्ते 🤗!! आपका  नाम  क्या है? 📱 | " +
      "हाय ☺️ अपना  नाम  बताइए | " +
      "नमस्कार 👋, अपना  नाम  बताइए 🙂 ",
  },

  age: {
    EN:
      "Nice to meet you  name ! 🎂 How old are you? 🙂 | " +
      "What’s your  age   name ? ☺️ | " +
      "Please tell me your  age  🕰️ | " +
      "So  name , how many years old are you? 🎂",
    HI:
      "मिलकर अच्छा लगा नाम जी 🎂, आपकी उम्र क्या है? 🙂 | " +
      "आप कितने साल के हो नाम? ☺️ | " +
      "अपनी उम्र बताइए 🕰️ | " +
      "बताइए, आपकी उम्र कितनी है 🎂🙂",
  },

  residence_city: {
    EN:
      "Which   city   🏙️ are you living in   name  ? 🙂 | " +
      "So  name  📍, which city you live in? 🏡 | " +
      "What’s your  current city  📍? ☺️ | ",
    HI:
      "आप किस  शहर  🏙️ में रहते हो  नाम ? 🙂 | " +
      "तो  नाम  📍, अभी किस  शहर  में हो? 🏡 | " +
      "आपका  शहर  कौन सा है 📍? ☺️ | "
  },

  job_preference_city: {
    EN:
      "In which  city  🏢 do you want to work? 💼🙂 | " +
      "Which city 📍 you want to work? ☺️ | " +
      "Which  city  do you want job in? 🚀",
    HI:
      "आप किस  शहर  🏢 में काम करना चाहते हो? 💼🙂 | " +
      "आपको किस  शहर  📍 में जॉब चाहिए? ☺️ | " +
      "किस  शहर  में जॉब करोगे? 🚀",
  },
};
export const validationOptions: Record<string, string> = {
  full_name: `Extract a *human name* (first + last if available). Reject numbers, special characters, or gibberish.`,

  age: `Extract the *numeric age* if mentioned in text (e.g., "I am 34 years old" → 34).
    Return valid only if it's a number between 18 and 70. Reject unrealistic ages.`,

  residence_city: `Accept if input resembles an Indian city/town (even with typos/unknown names); reject if only numbers, gibberish, or unrelated words.`,



  job_preference_city: `Check if the input refers to a *real city in India* where the user wants a job.
   If the user uses abbreviations, typos, or alternate spellings (e.g., "Bangalor","Bengalore", "Banglore", "Hyd", "Hydrabad"), return the canonical city name as in the database (e.g., "Bengaluru", "Hyderabad").
   Examples: "Mumbai", "Hyderabad". Reject numbers or random words.`,
};

export const roleAgeRestrictions: Record<
  string,
  { min?: number; max?: number }
> = {
  Driver: { min: 25 },
  "Picker/Packer": { min: 18, max: 35 },
  "Van Associate": { min: 18, max: 35 },
  "CSO (Chief Sales Officer)": { max: 45 },
  Callers: { min: 18, max: 35 },
};