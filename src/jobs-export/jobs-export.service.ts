import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import * as fs from 'fs';

@Injectable()
export class JobsExportService {
  private readonly logger = new Logger(JobsExportService.name);
  private supabase: SupabaseClient;
  private sheets: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Google Sheets Auth (reuse your service account logic)
    const credentialsPath = '/tmp/google-credentials.json';
    if (!fs.existsSync(credentialsPath)) {
      const base64 = process.env.GOOGLE_SERVICE_JSON;
      if (!base64) throw new Error('Missing GOOGLE_SERVICE_JSON');
      const buffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(credentialsPath, buffer);
    }
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async exportToSheet() {
    this.logger.log('📤 Exporting jobs + locations to Google Sheet...');

    const { data, error } = await this.supabase
      .from('job_locations')
      .select(
        `
        job_id,
        state,
        city,
        locality,
        is_active,
        jobs ( role, client, salary )
      `
      ) .order('job_id', { ascending: false });

    if (error) {
      this.logger.error(`❌ Failed to fetch jobs: ${error.message}`);
      throw new Error(error.message);
    }

    // Flatten
    const records = data.map((row: any) => [
      row.jobs?.role,
      row.jobs?.client,
      row.jobs?.salary,
      row.city,
      row.state,
      row.locality ? row.locality.join(', ') : '',
      row.job_id,
      row.is_active ? 'Active' : 'Inactive',
    ]);

    const headers = ['role', 'client', 'salary', 'city', 'state', 'locality', 'job_id', 'Active Status'];
    const values = [headers, ...records];

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = 'JobsExport';

    // Clear existing sheet before writing
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A1:Z`,
    });

    // Write new data
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    this.logger.log(`✅ Export complete. ${records.length} rows written.`);
    return { success: true, rowsWritten: records.length };
  }
}
