import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TerminusModule } from "@nestjs/terminus";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HandlebarsAdapter, MailerModule } from "@nestjs-modules/mailer";
// TODO: Needed for email, #54
// import { SES } from "aws-sdk";
// import * as SESTransport from "nodemailer/lib/ses-transport";
import * as StreamTransport from "nodemailer/lib/stream-transport";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { HealthCheckModule } from "./healthcheck/healthcheck.module";
import { ProjectsModule } from "./projects/projects.module";
import { RegionConfigsModule } from "./region-configs/region-configs.module";
import { UsersModule } from "./users/users.module";

import { join } from "path";

// In development the email service is a no-op that only logs
// TODO: Use SESTransport.Options instead if using SES in #54
const mailTransportOptions: StreamTransport.Options = {
  streamTransport: true,
  buffer: true,
  newline: "unix"
};

@Module({
  imports: [
    MailerModule.forRoot({
      transport: mailTransportOptions,
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>'
      },
      template: {
        dir: join(__dirname, "..", "..", "templates"),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true
        }
      }
    }),
    TypeOrmModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "static"),
      // https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts
      serveStaticOptions: {
        maxAge: 60000
      }
    }),
    TerminusModule,
    AuthModule,
    HealthCheckModule,
    UsersModule,
    RegionConfigsModule,
    ProjectsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
