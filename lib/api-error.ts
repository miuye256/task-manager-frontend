type ApiErrorKind = "network" | "invalid_response" | "validation" | "http";

type ApiFieldErrors = Record<string, string[]>;

// ASP.NET Coreのエラー応答から一部を抜粋して定義
export type BackendErrorResponse = {
  title?: string;
  detail?: string;
  errors?: ApiFieldErrors;
};

type ApiErrorOptions = {
  kind: ApiErrorKind;
  displayTitle: string; // 失敗した操作内容
  message?: string; // 失敗理由
  status?: number;
  cause?: unknown;
  backendError?: BackendErrorResponse | string;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly displayTitle: string;
  readonly status?: number;
  override readonly cause?: unknown;
  readonly backendError?: BackendErrorResponse | string;

  constructor(options: ApiErrorOptions) {
    super(options.message ?? getApiErrorMessage(options.kind, options.status));
    this.displayTitle = options.displayTitle;
    this.kind = options.kind;
    this.status = options.status;
    this.cause = options.cause;
    this.backendError = options.backendError;
  }
}

const networkErrorMessage = "サーバーに接続できませんでした。";
const validationErrorMessage = "入力内容を確認してください。";
const invalidResponseMessage = "サーバーの応答が正しくありません。";
const http404ErrorMessage = "リクエスト先が見つかりませんでした。";
const http409ErrorMessage =
  "他の変更と競合しています。ページを再読み込みしてからやり直してください。";
const http500ErrorMessage =
  "サーバーでエラーが発生しました。時間をおいてからやり直してください。";
const httpGenericErrorMessage =
  "リクエストを処理できませんでした。時間をおいてからやり直してください。";

export function getApiErrorMessage(
  kind: ApiErrorKind,
  status?: number,
): string {
  if (kind === "network") {
    return networkErrorMessage;
  }

  if (kind === "validation") {
    return validationErrorMessage;
  }

  if (kind === "invalid_response") {
    return invalidResponseMessage;
  }

  if (kind === "http") {
    if (status === undefined) {
      return httpGenericErrorMessage;
    } else if (status == 404) {
      return http404ErrorMessage;
    } else if (status == 409) {
      return http409ErrorMessage;
    } else if (status >= 500 && status < 600) {
      return http500ErrorMessage;
    } else {
      return httpGenericErrorMessage;
    }
  }

  return "不明なエラーが発生しました。";
}
