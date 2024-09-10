import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class BaseResponse<T> {
  @ApiProperty({ type: Number })
  responseCode: number;

  @ApiProperty({ type: String })
  responseMessage: string;

  @ApiProperty({ type: () => Object })
  responseData: T | undefined;

  /**
   * Create a BaseResponse with given data, message and status.
   *
   * @param data the data to be returned in the response
   * @param message the message to be returned in the response
   * @param status the status of the response
   * @returns a BaseResponse with the given data, message and status
   */
  static getResponse<T>(data?: T, message?: string, status?: number) {
    const response: BaseResponse<T> = new BaseResponse();
    response.responseCode = status ?? HttpStatus.OK;
    response.responseMessage = message ?? 'Success';
    response.responseData = data ?? undefined;
    return response;
  }
}

export type BaseResponseDto<T> = BaseResponse<T>;
