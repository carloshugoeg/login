import { DomainError } from '../../../domain/errors/DomainError.js';

/** Único punto que traduce errores a respuestas. */
export function errorHandler({ logger = console } = {}) {
  return (error, _req, res, _next) => {
    if (error instanceof DomainError) {
      return res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      });
    }

    logger.error(error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' },
    });
  };
}
