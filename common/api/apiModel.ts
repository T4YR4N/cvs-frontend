export type ApiResponse<T = undefined> =
  | {
      success: false;
      message: string;
      responseObject: null;
      statusCode: number;
    }
  | {
      success: true;
      message: string;
      responseObject: T;
      statusCode: number;
    };
