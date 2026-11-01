import { defineConfig } from '@playwright/test';
// GitHub's fresh Windows machines are slower than the development PC, so native work (password, redaction and
// recovery checks) gets more time there. Local runs keep the tighter limits so real slowdowns still show.
const ci = !!process.env.CI;
export default defineConfig({ testDir:'./tests/desktop', timeout:ci?180000:60000, expect:{timeout:ci?30000:5000}, workers:1, reporter:'list', use:{trace:'retain-on-failure'}, outputDir:'test-results' });
