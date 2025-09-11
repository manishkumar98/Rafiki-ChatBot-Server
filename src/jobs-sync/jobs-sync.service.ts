import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { google } from 'googleapis';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

@Injectable()
export class JobsSyncService {
  private readonly logger = new Logger(JobsSyncService.name);
  private supabase: SupabaseClient;

  private auth: any;
  private sheets: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Google credentials init
    const credentialsPath = '/tmp/google-credentials.json';
    if (!fs.existsSync(credentialsPath)) {
      const base64 = process.env.GOOGLE_SERVICE_JSON;
      if (!base64) throw new Error('Missing GOOGLE_SERVICE_JSON');
      const buffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(credentialsPath, buffer);
    }
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  private async fetchSheetData() {
    const sheetId = process.env.SPREADSHEET_ID;
    const range = 'Jobs!A2:H'; // update if your sheet name changes

    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return res.data.values || [];
  }

  async syncJobs() {
    this.logger.log('🚀 Starting Google Sheet sync...');
    const rows = await this.fetchSheetData();
    this.logger.log(`📊 Total rows fetched: ${rows.length}`);

    for (const [index, row] of rows.entries()) {
      const [role, client, salary, city, state, locality, jobId, activeStatus] = row;
      const isActive = activeStatus?.toLowerCase() === 'active';
      let currentJobId = jobId;

      try {
        if (!currentJobId) {
          // Insert new job
          const { data: newJob, error } = await this.supabase
            .from('jobs')
            .insert([{ role, client, salary }])
            .select('id')
            .single();

          if (error) {
            this.logger.error(`❌ Row ${index + 2}: Failed to insert job → ${error.message}`);
            continue;
          }
          currentJobId = newJob.id;

          await this.supabase.from('job_locations').insert([
            { job_id: currentJobId, city, state, locality: locality ? [locality] : [], is_active: isActive },
          ]);

          this.logger.log(`✅ Row ${index + 2}: Inserted new job ${role} (${client}) with id=${currentJobId}`);
        } else {
          // Update existing
          await this.supabase.from('jobs').update({ role, client, salary }).eq('id', currentJobId);

          await this.supabase
            .from('job_locations')
            .update({ city, state, locality: locality ? [locality] : [], is_active: isActive })
            .eq('job_id', currentJobId)
            .eq('city', city)
            .eq('state', state);

          this.logger.log(`🔄 Row ${index + 2}: Updated job_id=${currentJobId} (${role}, ${client})`);
        }
      } catch (err) {
        this.logger.error(`💥 Row ${index + 2}: Unexpected error → ${err.message}`);
      }
    }

    this.logger.log('🏁 Google Sheet sync finished.');
    return { success: true, rowsProcessed: rows.length };
  }

  // Run every midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    return this.syncJobs();
  }
}
