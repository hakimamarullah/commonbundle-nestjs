import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HtmlTemplateService } from './html-template.service';

@Module({
  providers: [HtmlTemplateService],
  exports: [HtmlTemplateService],
})
export class HtmlTemplateModule {
  static forRoot(assetsPath: string): DynamicModule {
    const htmlTemplateServiceProvider: Provider = {
      provide: HtmlTemplateService,
      useFactory: () => new HtmlTemplateService(assetsPath),
    };

    return {
      module: HtmlTemplateModule,
      providers: [htmlTemplateServiceProvider],
      exports: [HtmlTemplateService],
      global: true,
    };
  }
}
