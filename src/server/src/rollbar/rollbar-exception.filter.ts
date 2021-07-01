import {
  ArgumentsHost,
  Catch,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { Request } from "express";
import { BaseExceptionFilter } from "@nestjs/core";
import { RollbarService } from "./rollbar.service";

export interface IGetUserAuthInfoRequest extends Request {
  user?: {
    id: number;
  };
  socket: any;
}

function isWhitelisted(exception: HttpException) {
  // Note that we don't need to whitelist BadRequestException as it has it's
  // own exception filter already
  return (
    exception instanceof NotFoundException ||
    exception instanceof ServiceUnavailableException ||
    exception instanceof UnauthorizedException
  );
}

function parseIp(req: IGetUserAuthInfoRequest): string {
  // @ts-ignore
  const ip: string =
    req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress;
  return ip;
}

@Catch()
export class RollbarExceptionFilter extends BaseExceptionFilter {
  constructor(private rollbar: RollbarService) {
    // BaseExceptionFilter will load applicationRef itself if no argument is given
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      (exception instanceof HttpException && !isWhitelisted(exception)) ||
      (exception instanceof Error && !(exception instanceof HttpException))
    ) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<IGetUserAuthInfoRequest>();

      this.rollbar.error(exception, {
        ...request,
        user_id: request.user ? request.user.id : null,
        user_ip: parseIp(request)
      });
    }

    // Delegate error messaging and response to default global exception filter
    super.catch(exception, host);
  }
}
