import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (
    data: string | undefined,
    ctx: ExecutionContext,
  ) => {
    const request: Express.Request = ctx
      .switchToHttp()
      .getRequest();

    // Handle case where user might not be on request
    if (!request.user) {
      return undefined;
    }

    // check if a string of what data you want got passed
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
