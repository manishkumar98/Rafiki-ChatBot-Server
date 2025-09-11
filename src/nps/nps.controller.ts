import { Controller, Post } from "@nestjs/common";
import { NpsService } from "./nps.service";

@Controller("nps")
export class NpsController {
  constructor(private npsService: NpsService) {}
 
  @Post("trigger")
  async triggerNpsBatch() {
    return this.npsService.triggerBatch();
  }
}
