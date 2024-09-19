import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

@Injectable()
export class HtmlTemplateService implements OnModuleInit {
  private readonly logger = new Logger(HtmlTemplateService.name);
  private templates: Map<string, string> = new Map();
  private readonly placeholderPattern = /{{(\w+)}}/g;

  async onModuleInit() {
    await this.loadTemplates();
  }

  private async loadTemplates() {
    this.logger.log('[START] LOADING HTML TEMPLATE FILES');

    try {
      // Path to the assets/templates directory
      const templatesDir = path.join(
        __dirname,
        '..',
        '..',
        'assets',
        'templates',
      );
      const files = await readdir(templatesDir);

      await Promise.all(
        files.map(async (file) => {
          if (file.endsWith('.html')) {
            const content = await readFile(path.join(templatesDir, file));
            const filename = file.replace('.html', '');
            this.templates.set(filename, content?.toString('utf-8'));
          }
        }),
      );

      this.logger.log(
        `[END] LOADING HTML TEMPLATE FILES: ${this.templates.size} templates loaded`,
      );
    } catch (error) {
      this.logger.error('Failed to load templates', error);
    }
  }

  public getTemplate(name: string): string | undefined {
    return this.templates.get(name);
  }

  public fillTemplate(
    templateName: string,
    params: Record<string, any>,
  ): string {
    const template = this.getTemplate(templateName);
    if (!template) {
      this.logger.warn(`Template "${templateName}" not found`);
      return '';
    }

    return template.replace(this.placeholderPattern, (match, placeholder) => {
      const replacement = params[placeholder];
      return replacement !== undefined ? String(replacement) : match;
    });
  }
}
