import { BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { BaseResponse } from '../../http/dto';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

export const extractUsernameFromEmail = (email: string): string => {
  if (!email) {
    throw new BadRequestException('Email is required');
  }
  return email.split('@')[0];
};

/**
 * Hash a password using bcrypt.
 *
 * @param password The password to hash.
 * @param saltOrRound The number of rounds to use when hashing the password.
 ** @returns The hashed password.
 * */
export const hashPassword = (
  password: string,
  saltOrRound?: number,
): string => {
  if (!password) {
    throw new BadRequestException('Password is required');
  }
  return bcrypt.hashSync(password, saltOrRound ?? 10);
};

export const isPasswordValid = (
  password: string,
  hash: string | undefined,
): boolean => {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compareSync(password, hash);
};

/**
 * Translate a Prisma error into a BaseResponse object.
 *
 * @param err The error from Prisma.
 * @param defaultMessage The default message to use if the error is not a
 *                        PrismaClientKnownRequestError or
 *                        PrismaClientValidationError.
 * @returns A BaseResponse object containing the translated error.
 */
export const translatePrismaError = (err: Error, defaultMessage: string) => {
  const response: BaseResponse<any> = new BaseResponse();
  response.responseMessage = defaultMessage;
  if (err instanceof PrismaClientValidationError) {
    response.responseCode = HttpStatus.BAD_REQUEST;
    const messages = err.message.split('\n');
    response.responseData =
      messages[messages.length - 1]?.trim() ?? PrismaClientValidationError.name;
    return response;
  }

  const prismaErr: PrismaError = getPrismaError(err);
  response.responseCode = prismaErr.httpStatus;
  response.responseData = prismaErr.message;
  return response;
};

/**
 * Add a specified number of days to the given date.
 *
 * @param date The date to which to add the days.
 * @param days The number of days to add.
 * @returns A new `Date` object, which is the result of adding
 * `days` to `date`.
 */

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculate a date 30 days from now.
 *
 * @returns A new `Date` object, which is 30 days from the current date.
 */

export const next30Days = () => {
  return addDays(new Date(), 30);
};

export declare interface PrismaError {
  message: string;
  httpStatus: number;
}
export const getPrismaError = (error: any): PrismaError => {
  const logger: Logger = new Logger('CommonUtil');
  switch (error.code) {
    case 'P2002':
      return {
        message: `Duplicate entry for attribute ${error.meta.target} of ${error.meta?.modelName}`,
        httpStatus: HttpStatus.CONFLICT,
      };
    case 'P2025':
      return {
        message: `Data not found`,
        httpStatus: HttpStatus.NOT_FOUND,
      };
    case 'P2003':
      return {
        message: `Foreign key constraint failed on the field: ${error.meta['field_name']}`,
        httpStatus: HttpStatus.BAD_REQUEST,
      };
    case 'P1001':
      return {
        message: 'Database connection timeout. Please try again.',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    case 'P2024': {
      const message = error?.message?.split('\n');
      return {
        message:
          message[message.length - 1]?.trim() ??
          `error ${error.code}: ${error.message}`,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
    default:
      logger.error(error);
      return {
        message: 'something went wrong',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      };
  }
};

/**
 * Converts a wildcard pattern to a regular expression.
 * @param pattern The wildcard pattern (e.g., '/api/somepath/*')
 * @returns A regular expression that matches the pattern.
 */
export const convertPatternToRegExp = async (
  pattern: string,
): Promise<RegExp> => {
  const escapedPattern = pattern
    .replace(/([.*+?^${}()|[\]\\])/g, '\\$1') // Escape special characters
    .replace(/:\w+/g, '\\w+') // Convert ':id' or ':parameter' to '\d+' for numeric values
    .replace(/\\\*/g, '.*') // Replace '*' with '.*'
    .replace(/\\\?/g, '.') // Optionally replace '?' with '.'
    .replace(/\\\[/g, '[') // Unescape '[' for character classes
    .replace(/\\]/g, ']') // Unescape ']' for character classes
    .replace(/\\\(/g, '(') // Unescape '(' for capturing groups if needed
    .replace(/\\\)/g, ')'); // Unescape ')' for capturing groups if needed

  // Return a RegExp object with anchors to match the entire string
  return new RegExp(`^${escapedPattern}$`);
};

export const getUsername = (request: any) => {
  return request?.user?.username;
};

export const convertTo = async <T>(
  data: { [keyName: string]: string[] },
  transformer: (value: any) => Promise<T>,
): Promise<{ [keyName: string]: T[] }> => {
  const logger = new Logger('CommonUtil.ConvertTo');
  // Create a new object to store the results
  const result: { [keyName: string]: T[] } = {};

  // Iterate over each key in the input data
  for (const keyName of Object.keys(data)) {
    // Map each string pattern to its transformed value
    const transformedArray = await Promise.all(
      data[keyName].map(async (patternString) => {
        try {
          return await transformer(patternString);
        } catch (e) {
          logger.error(
            `Error transforming pattern string: ${patternString}`,
            e,
          );
          return null; // Exclude any failed transformations
        }
      }),
    ).then((arr) => arr.filter((item) => item !== null)); // Filter out null values

    // Add the transformed array to the result object
    result[keyName] = transformedArray as T[];
  }

  return result;
};

/**
 * Generate a random API key.
 *
 * The API key is a 256-bit (32-byte) AES key, represented as a hexadecimal
 * string. The key is generated using the `crypto` module's `generateKeySync`
 * method, which generates a cryptographically secure random key.
 *
 * @returns The generated API key, as a hexadecimal string.
 */

export const generateApiKey = (): string => {
  return crypto
    .generateKeySync('aes', { length: 256 })
    .export()
    .toString('hex');
};

/**
 * Convert a string representing a time duration to its equivalent value in milliseconds.
 *
 * The input string should be in the format of a number followed by an optional unit.
 * Supported units are:
 *   - 's' for seconds
 *   - 'm' for minutes
 *   - 'h' for hours
 *   - 'd' for days
 *   - No unit (default) for milliseconds
 *
 * @param {string} stringUnit The input string representing the time duration.
 * @returns {number} The equivalent time duration in milliseconds.
 * @throws {Error} If the input string is invalid.
 */
export const stringTimeunitToMillis = (stringUnit: string): number => {
  // Default to milliseconds if no unit is specified
  const timeUnit = stringUnit.slice(-1).toLowerCase();
  const timeValue = parseInt(stringUnit.slice(0, -1), 10);

  // Check if time unit is valid
  if (isNaN(timeValue)) {
    throw new Error('Invalid time value');
  }

  switch (timeUnit) {
    case 's': // Seconds
      return timeValue * 1000;
    case 'm': // Minutes
      return timeValue * 60 * 1000;
    case 'h': // Hours
      return timeValue * 60 * 60 * 1000;
    case 'd': // Days
      return timeValue * 24 * 60 * 60 * 1000;
    case '': // No unit specified, assume milliseconds
      return timeValue;
    default:
      throw new Error('Invalid time unit');
  }
};
