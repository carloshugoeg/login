/** Un adaptador no implementó un método obligatorio de su puerto. */
export class NotImplementedError extends Error {
  constructor(portName, method) {
    super(`${portName} debe implementar ${method}().`);
    this.name = 'NotImplementedError';
  }
}
