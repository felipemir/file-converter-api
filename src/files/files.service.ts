import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname, basename } from 'path';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import MarkdownIt from 'markdown-it';
import { PdfRendererService } from './services/pdf-renderer.service';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FilesService {
  private readonly markdown = new MarkdownIt({ html: true, linkify: true });

  constructor(private readonly pdfRenderer: PdfRendererService) {}

  // Routes the conversion flow based on the file extension and keeps output naming consistent.
  async convertToPdf(file: Express.Multer.File): Promise<{
    filename: string;
    buffer: Buffer;
  }> {
    this.ensureFileWasProvided(file);
    this.ensureFileSize(file);

    const fileExtension = extname(file.originalname).toLowerCase();
    const fileBaseName = basename(file.originalname, fileExtension);

    switch (fileExtension) {
      case '.docx':
        return {
          filename: `${fileBaseName}.pdf`,
          buffer: await this.convertDocx(file),
        };
      case '.md':
        return {
          filename: `${fileBaseName}.pdf`,
          buffer: await this.convertMarkdown(file),
        };
      case '.html':
      case '.htm':
        return {
          filename: `${fileBaseName}.pdf`,
          buffer: await this.convertHtml(file),
        };
      case '.png':
      case '.jpg':
      case '.jpeg':
        return {
          filename: `${fileBaseName}.pdf`,
          buffer: await this.convertImage(file),
        };
      default:
        throw new UnsupportedMediaTypeException(
          'Supported formats: DOCX, Markdown, HTML, PNG, JPG, JPEG',
        );
    }
  }

  private ensureFileWasProvided(file?: Express.Multer.File): asserts file {
    if (!file) {
      throw new BadRequestException('A file must be provided');
    }
  }

  private ensureFileSize(file: Express.Multer.File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File exceeds the 10 MB limit');
    }
  }

  // DOCX -> HTML (Mammoth) -> PDF (Puppeteer).
  private async convertDocx(file: Express.Multer.File): Promise<Buffer> {
    const arrayBuffer = this.bufferToArrayBuffer(file.buffer);
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    const wrappedHtml = this.wrapHtml(html, file.originalname);
    return this.pdfRenderer.renderHtml(wrappedHtml);
  }

  private async convertMarkdown(file: Express.Multer.File): Promise<Buffer> {
    const markdownContent = file.buffer.toString('utf-8');
    const html = this.markdown.render(markdownContent);
    const wrappedHtml = this.wrapHtml(html, file.originalname);
    return this.pdfRenderer.renderHtml(wrappedHtml);
  }

  private async convertHtml(file: Express.Multer.File): Promise<Buffer> {
    const htmlContent = file.buffer.toString('utf-8');
    const wrappedHtml = this.wrapHtml(htmlContent, file.originalname);
    return this.pdfRenderer.renderHtml(wrappedHtml);
  }

  private async convertImage(file: Express.Multer.File): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    const image =
      file.mimetype === 'image/png'
        ? await pdfDoc.embedPng(file.buffer)
        : await pdfDoc.embedJpg(file.buffer);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private wrapHtml(content: string, title: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; }
          img { max-width: 100%; }
          pre { background: #f4f4f4; padding: 1rem; overflow: auto; }
          code { font-family: 'Courier New', Courier, monospace; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>`;
  }

  private bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  }
}
