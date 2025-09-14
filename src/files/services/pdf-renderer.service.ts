import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class PdfRendererService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(PdfRendererService.name);

  // Reuses a single Chromium instance to render arbitrary HTML into a PDF buffer.
  async renderHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Lazily boots Puppeteer to avoid paying the startup cost on module load.
  private async getBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      return this.browser;
    } catch (error) {
      this.logger.error(
        'Failed to launch Puppeteer',
        (error as Error).stack,
      );
      throw error;
    }
  }
}
