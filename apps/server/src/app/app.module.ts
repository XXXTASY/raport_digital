import { INestApplication, Module } from '@nestjs/common';
import { TrpcModule } from '../trpc/trpc.module';
import { AppRouter } from './app.router';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { AuthModule } from '../auth/auth.module';
import { OperatorModule } from '../operator/operator.module';
import { GuruModule } from '../guru/guru.module';
import { CommonModule } from '../common/common.module';
import { KepalaSekolahModule } from '../kepala-sekolah/kepala-sekolah.module';
import { ServeStaticModule } from "@nestjs/serve-static"
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../', 'client', 'dist'),
    }),
    PrismaModule,
    TrpcModule,
    AuthModule,
    CommonModule,
    OperatorModule,
    GuruModule,
    KepalaSekolahModule,
  ],
  providers: [AppRouter],
})
export class AppModule {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly configService: ConfigService
  ) {}

  configureApp(app: INestApplication) {
    app.use(
      session({
        store: new PrismaSessionStore(this.prismaClient, {
          checkPeriod: 2 * 60 * 1000, //ms
          dbRecordIdIsSessionId: true,
          dbRecordIdFunction: undefined,
        }),
        secret: this.configService.getOrThrow<string>('SESSION_SECRET'),
        resave: true,
      })
    );
  }
}
