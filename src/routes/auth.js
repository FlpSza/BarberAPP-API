const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Usuario } = require('../models');

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 1 }).withMessage('Senha é obrigatória')
], async (req, res) => {
  const { email, senha } = req.body;
  console.log('Tentativa de login:', email, senha);

  const usuario = await Usuario.findOne({ where: { email } });
  console.log('Usuário encontrado:', usuario);

  if (!usuario) {
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }

  if (usuario.senha !== senha) {
    return res.status(401).json({ message: 'Senha incorreta' });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { email, senha } = req.body;

    // Buscar usuário
    const user = await Usuario.findOne({ where: { email, ativo: true } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    let senhaValida = false;
    if (user.tipo === 'admin') {
      // Permite admin logar com senha em texto puro
      senhaValida = user.senha === senha;
    } else {
      // Para outros usuários, usa bcrypt
      senhaValida = await bcrypt.compare(senha, user.senha);
    }
    
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Remover senha da resposta
    const { senha: _, ...userData } = user.toJSON();

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findByPk(decoded.userId, {
      attributes: { exclude: ['senha'] }
    });

    if (!user || !user.ativo) {
      return res.status(401).json({ valid: false, message: 'Usuário inválido' });
    }

    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token inválido' });
  }
});

module.exports = router;