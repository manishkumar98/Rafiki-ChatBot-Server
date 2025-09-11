import { roleAgeRestrictions } from "../constants/constants";

export async function handleRoleSelection({
  text,
  state,
  lang,
  from,
  stateService,
  jobs,
  openAi,
}: {
  text: string;
  state: any;
  lang: "EN" | "HI";
  from: string;
  stateService: any;
  jobs: any;
  openAi: any;
}) {
  const selectedIndex = parseInt(text, 10);
  if (isNaN(selectedIndex) || !state.roleMap[selectedIndex]) {
    return lang === "EN"
      ? `❌ Invalid choice. Please reply with a valid number between 1 and ${Object.keys(
          state.roleMap
        ).length}.`
      : `❌ गलत विकल्प। कृपया 1 से ${Object.keys(state.roleMap).length} के बीच सही नंबर लिखें।`;
  }

  const selectedRole = state.roleMap[selectedIndex];
  // ✅ Check age restriction
  const userAge = parseInt(state.answers.age, 10);
  const restriction = roleAgeRestrictions[selectedRole];

  if (restriction) {
    const { min, max } = restriction;
    if ((min && userAge < min) || (max && userAge > max)) {
      // reset state and reject
      stateService.reset(from);
      stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });

      const msg =
        lang === "EN"
          ? `❌ Sorry, the role *${selectedRole}* requires age ${
              min && max
                ? `between ${min} and ${max}`
                : min
                ? `above ${min}`
                : `below ${max}`
            } years. Please try another role. Type *Hi* to restart.`
          : `❌ क्षमा करें, इस भूमिका *${selectedRole}* के लिए उम्र ${
              min && max
                ? `${min} से ${max} वर्ष के बीच`
                : min
                ? `${min} वर्ष से अधिक`
                : `${max} वर्ष से कम`
            } होनी चाहिए। कृपया कोई और भूमिका चुनें। *Hi* लिखकर फिर से शुरू करें।`;

      await jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }
  }

  // ✅ If age is valid, continue flow
  stateService.update(from, { selectedRole, step: 1 });
  const firstQ = await openAi.getRoleQuestion(
    selectedRole,
    0,
    state.language,
    state.answers
  );
  if (firstQ) {
     const buttons =
      lang === "HI"
        ? [
            { id: "yes", title: "✅ हाँ" },
            { id: "no", title: "❌ नहीं" },
          ]
        : [
            { id: "yes", title: "✅ Yes" },
            { id: "no", title: "❌ No" },
          ];
    await jobs.sendWhatsAppMessage(from, firstQ.question, buttons);
    return firstQ.question;
  }

  return lang === "EN"
    ? `❌ Invalid choice. Please reply with a valid number between 1 and ${Object.keys(
        state.roleMap
      ).length}.`
    : `❌ गलत विकल्प!!!!। कृपया 1 से ${Object.keys(state.roleMap).length} के बीच सही नंबर लिखें।`;
}
