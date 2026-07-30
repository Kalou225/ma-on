import { ZodError } from 'zod';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.validated = validated;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issueDetails = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return res.status(400).json({
        error: 'Validation des données serveur échouée.',
        details: issueDetails,
      });
    }
    next(error);
  }
};
