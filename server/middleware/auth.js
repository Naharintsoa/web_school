/**
 * Middleware d'authentification — vérifie le JWT depuis le cookie httpOnly
 */
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // AuthSession
    next();
  } catch {
    return res.status(401).json({ message: 'Session invalide ou expirée.' });
  }
}
