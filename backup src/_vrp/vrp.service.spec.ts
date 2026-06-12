/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { VrpService } from './vrp.service';

describe('VrpService', () => {
  let service: VrpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VrpService],
    }).compile();

    service = module.get<VrpService>(VrpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
