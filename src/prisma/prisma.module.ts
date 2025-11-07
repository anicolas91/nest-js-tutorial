import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// We add a global bit so that our data is available to everyone and we dont load every time
@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService]
})
export class PrismaModule {}
