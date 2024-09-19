import { Test, TestingModule } from '@nestjs/testing';
import { HtmlTemplateService } from './html-template.service';

describe('HtmlTemplateService', () => {
  let service: HtmlTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlTemplateService],
    }).compile();

    service = module.get<HtmlTemplateService>(HtmlTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
