import { DynamicModule, Module } from '@nestjs/common';
import { HtmlTemplateService } from './html-template.service';
import { ASSETS_PATH } from './assets-path.token';

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
          provide: ASSETS_PATH,
          useValue: assetsPath,
        },
        HtmlTemplateService,
      ],
      exports: [HtmlTemplateService],
    };
  }
}
