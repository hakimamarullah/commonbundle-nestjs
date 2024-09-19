import { DynamicModule, Module } from '@nestjs/common';
import { HtmlTemplateService } from './html-template.service';

@Module({
  providers: [HtmlTemplateService],
  exports: [HtmlTemplateService],
})
export class HtmlTemplateModule {
  static forRoot(assetsPath: string): DynamicModule {
    return {
      module: HtmlTemplateModule,
      providers: [
        {
          provide: HtmlTemplateService,
          useValue: new HtmlTemplateService(assetsPath),
        },
      ],
      exports: [HtmlTemplateService],
    };
  }
}
