import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class AppService {
  constructor() {
    Logger.log(`instantiate ${AppService.name} on every request`);
  }
  getHello(): string {
    return 'Hello World!';
  }
}
