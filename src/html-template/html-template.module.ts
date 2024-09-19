import { Module } from '@nestjs/common';
import { HtmlTemplateService } from './html-template.service';

@Module({
  providers: [HtmlTemplateService],
  exports: [HtmlTemplateService],
})
export class HtmlTemplateModule {}
