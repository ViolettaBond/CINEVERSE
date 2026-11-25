// Ошибка с HTTP-статусом: её текст безопасно показывать пользователю
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
