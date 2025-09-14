const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./src/models');

// Importar rotas
const authRoutes = require('./src/routes/auth');
const clienteRoutes = require('./src/routes/clientes');
const barbeiroRoutes = require('./src/routes/barbeiros');
const servicoRoutes = require('./src/routes/servicos');
const agendamentoRoutes = require('./src/routes/agendamentos');
const produtoRoutes = require('./src/routes/produtos');
const vendaRoutes = require('./src/routes/vendas');
const pagamentosRoutes = require('./src/routes/pagamentos');
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/barbeiros', barbeiroRoutes);
app.use('/api/servicos', servicoRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/pagamentos', pagamentosRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API BarberShop funcionando!' });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Conectar ao banco e iniciar servidor
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    
    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados com o banco de dados');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
    process.exit(1);
  }
}

startServer();
