/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { VrpController } from './vrp.controller';

describe('VrpController', () => {
  let controller: VrpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VrpController],
    }).compile();

    controller = module.get<VrpController>(VrpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
