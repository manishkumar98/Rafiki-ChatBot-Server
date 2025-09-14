import { google } from "googleapis";
import * as fs from "fs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SheetsService {
  private auth;
  private sheets;
  constructor() {
    const credentialsPath = "/tmp/google-credentials.json";

    if (!fs.existsSync(credentialsPath)) {
      const base64 = process.env.GOOGLE_SERVICE_JSON;
      if (!base64) throw new Error("Missing GOOGLE_SERVICE_JSON");
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(credentialsPath, buffer);
    }
    const credentials = JSON.parse(
      fs.readFileSync("/tmp/google-credentials.json", "utf8")
    );
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }
 
  async appendRow(session: Record<string, any>, phone: string) {
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const filteredSession = Object.fromEntries(
      Object.entries(session).filter(
        ([key]) => !["step", "lang", "substep", "questionIndex"].includes(key)
      )
    );
    if (filteredSession.jobRecords) {
      try {
        let jobs = filteredSession.jobRecords;
        if (typeof jobs === "string") {
          jobs = JSON.parse(jobs);
        }
        if (Array.isArray(jobs)) {
          filteredSession.jobRecords = jobs
            .map(
              (job) =>
                `${job.client} | ${job.city} | ${job.area.join(", ")} | ${job.salary}`
            )
            .join("\n");
        }
      } catch (err) {
        console.error("Failed to format jobRecords", err);
      }
    }
    filteredSession.phone = phone;

    const { answers, ...rest } = filteredSession;
    const flatAnswers = answers
      ? Object.entries(answers).reduce(
          (acc, [key, value]) => {
            if (key === "job_records" && Array.isArray(value)) {
              acc[key] = value
                .map(
                  (job) =>
                    `${job.client} | ${job.city} | ${job.area.join(", ")} | ${job.salary}`
                )
                .join("\n"); // if multiple jobs, each on new line
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, any>
        )
      : {};

    const flattenedSession = { ...rest, ...flatAnswers };

    const fixedFirstCols = ["full_name", "phone", "age", "residence_city", "job_preference_city"];
    const headersRes = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!1:1",
    });

    let headers: string[] = headersRes.data.values?.[0] || [];

    headers = headers.filter((h) => h !== "timestamp");

    headers = [
      ...fixedFirstCols,
      ...headers.filter((h) => !fixedFirstCols.includes(h)),
    ];

    const currentKeys = Object.keys(flattenedSession);
    for (const key of currentKeys) {
      if (!headers.includes(key) && key !== "timestamp") {
        headers.push(key);
      }
    }

    headers.push("timestamp");

    const valuesRow = headers.map((key) => {
      if (key === "timestamp") return new Date().toLocaleString();
      if (flattenedSession[key] !== undefined) {
        return typeof flattenedSession[key] === "object"
          ? JSON.stringify(flattenedSession[key])
          : flattenedSession[key];
      }
      return "";
    });

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [valuesRow] },
    });
  }

   async appendSupportRow(query: string, phone: string) {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = "SupportQueries";

    const headersRes = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    let headers: string[] = headersRes.data.values?.[0] || [];

    // enforce fixed headers
    const fixedHeaders = ["phone", "query", "timestamp"];
    headers = [...fixedHeaders, ...headers.filter((h) => !fixedHeaders.includes(h))];

    // prepare row
    const valuesRow = headers.map((key) => {
      if (key === "phone") return phone;
      if (key === "query") return query;
      if (key === "timestamp") return new Date().toLocaleString();
      return "";
    });

    // ensure headers are written
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });

    // append data row
    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [valuesRow] },
    });
  }

  async appendFeedbackRow(answers: Record<string, any>, phone: string) {
  console.log
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = "Feedback";

  const headersRes = await this.sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  let headers: string[] = headersRes.data.values?.[0] || [];

  // enforce fixed headers
  const fixedHeaders = ["phone", "timestamp"];
  const answerKeys = Object.keys(answers || {});
  headers = [...fixedHeaders, ...headers.filter(h => !fixedHeaders.includes(h)), ...answerKeys];

  const valuesRow = headers.map((key) => {
    if (key === "phone") return phone;
    if (key === "timestamp") return new Date().toLocaleString();
    if (answers[key] !== undefined) {
      return typeof answers[key] === "object" ? JSON.stringify(answers[key]) : answers[key];
    }
    return "";
  });

  // ensure headers
  await this.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });

  // append row
  await this.sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [valuesRow] },
  });
}

async appendKycRow(answers: Record<string, any>, phone: string) {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = "KYC"; // 👈 Create this sheet manually in Google Sheets

  // get existing headers from sheet
  const headersRes = await this.sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  let headers: string[] = headersRes.data.values?.[0] || [];

  // enforce fixed headers
  const fixedHeaders = ["phone", "timestamp"];
  const answerKeys = Object.keys(answers || {});

  // merge fixed, existing, and new keys
  let newHeaders = [
    ...fixedHeaders,
    ...headers.filter((h) => !fixedHeaders.includes(h)),
    ...answerKeys,
  ];

  // de-duplicate while preserving order
  newHeaders = newHeaders.filter((h, idx) => newHeaders.indexOf(h) === idx);

  // build row according to final header order
  const valuesRow = newHeaders.map((key) => {
    if (key === "phone") return phone;
    if (key === "timestamp") return new Date().toLocaleString();
    if (answers[key] !== undefined) {
      return typeof answers[key] === "object"
        ? JSON.stringify(answers[key])
        : answers[key];
    }
    return "";
  });

  // update headers only if changed
  if (JSON.stringify(newHeaders) !== JSON.stringify(headers)) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newHeaders] },
    });
  }

  // append row
  await this.sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [valuesRow] },
  });
}


async readNumbers(): Promise<{ phone: string; type: string }[]> {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = "NPS";

  const res = await this.sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:B`,
  });

  const rows = res.data.values || [];
  if (!rows.length) return [];

  return rows
    .map((row, i) => {
      const phone = String(row[0] || "").trim();
      const type = String(row[1] || "ALL").trim();

      // ✅ validate phone number (basic check)
      if (!/^\d{8,15}$/.test(phone)) {
        console.warn(`Skipping invalid phone at row ${i + 2}: ${phone}`);
        return null;
      }

      return { phone, type };
    })
    .filter((r) => r !== null) as { phone: string; type: string }[];
}

}
