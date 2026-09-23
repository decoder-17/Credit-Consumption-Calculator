export class MissingRateDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingRateDataError";
  }
}
