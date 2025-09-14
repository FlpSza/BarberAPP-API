const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findByPk(decoded.userId, {
      attributes: { exclude: ['senha'] }
    });
    
    if (!user || !user.ativo) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

module.exports = { authenticateToken };