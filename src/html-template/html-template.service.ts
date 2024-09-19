import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { CONFIG_OPTIONS } from './config-options.token';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

@Injectable()
export class HtmlTemplateService implements OnModuleInit {
  private readonly logger = new Logger(HtmlTemplateService.name);
  private templates: Map<string, string> = new Map();
  private readonly placeholderPattern = /{{(\w+)}}/g;

  constructor(@Inject(CONFIG_OPTIONS) private config: Record<string, any>) {}

  async onModuleInit() {
    await this.loadTemplates();
  }

  private async loadTemplates() {
    this.logger.log('[START] LOADING HTML TEMPLATE FILES');

    try {
      const templatesDir = path.join(this.config.assetsDir, 'templates');
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
    let template = this.getTemplate(templateName);
    if (!template) {
      this.logger.warn(`Template "${templateName}" not found`);
      return '';
    }

    // Replace placeholders in the template with corresponding values from params
    Object.keys(params).forEach((key) => {
      const placeholder = `{{${key.toUpperCase()}}}`; // Use uppercase to match placeholders
      if (template != null) {
        template = template.replace(
          new RegExp(placeholder, 'g'),
          String(params[key]),
        );
      }
    });

    return template; // Return the modified template
  }
}
