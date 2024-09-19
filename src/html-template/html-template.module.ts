import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './html-template.module-definition';
import { HtmlTemplateService } from './html-template.service';

@Module({
  providers: [HtmlTemplateService],
  exports: [HtmlTemplateService],
})
export class HtmlTemplateModule extends ConfigurableModuleClass {}
