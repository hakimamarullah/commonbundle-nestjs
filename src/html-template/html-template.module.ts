import { DynamicModule, Module } from '@nestjs/common';

import { HtmlTemplateService } from './html-template.service';
import { CONFIG_OPTIONS } from './config-options.token';

@Module({
  providers: [HtmlTemplateService],
  exports: [HtmlTemplateService],
})
export class HtmlTemplateModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: HtmlTemplateModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        HtmlTemplateService,
      ],
      exports: [HtmlTemplateService],
    };
  }
}
