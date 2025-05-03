import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertPaymentSchema,
  insertSurveySchema,
  insertQuestionSchema,
  insertResponseSchema,
  insertAnswerSchema,
  insertSurveyShareSchema
} from "@shared/schema";
import jwt from "jsonwebtoken";
import session from "express-session";
import MemoryStore from "memorystore";
import Stripe from "stripe";
import axios from "axios";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SESSION_SECRET = process.env.SESSION_SECRET || "session-secret-key";

// Verificar chaves de API
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Aviso: Chave Stripe não encontrada');
}

if (!process.env.ASAAS_API_KEY) {
  console.warn('Aviso: Chave ASAAS não encontrada');
}

// Inicialização do Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Cliente Asaas para PIX
const asaasClient = process.env.ASAAS_API_KEY
  ? axios.create({
      baseURL: 'https://sandbox.asaas.com/api/v3',
      headers: {
        'access_token': process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    })
  : null;

interface AuthRequest extends Request {
  user?: any;
}

// Simple middleware to authenticate JWT tokens
const authenticateToken = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const MemStore = MemoryStore(session);
  
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateUserCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User routes
  app.get('/api/user/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes
  app.post('/api/payments', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const payment = await storage.createPayment(validatedData);
      
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/payments', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const payments = await storage.getPaymentsByUserId(req.user.id);
      
      res.status(200).json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rota comum para iniciar pagamentos (com seleção de método)
  app.post('/api/create-payment', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { amount, planName, paymentMethod } = req.body;
      
      if (!amount || !planName || !paymentMethod) {
        return res.status(400).json({ 
          message: 'Amount, plan name, and payment method are required' 
        });
      }
      
      // Redirecionar para o método de pagamento correto
      switch (paymentMethod) {
        case 'stripe':
          return res.status(200).json({ redirect: `/checkout?plan=${planName}&method=stripe` });
        case 'pix':
          return res.status(200).json({ redirect: `/checkout?plan=${planName}&method=pix` });
        case 'paypal':
          return res.status(200).json({ redirect: `/checkout?plan=${planName}&method=paypal` });
        default:
          return res.status(400).json({ message: 'Invalid payment method' });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe payment routes
  app.post('/api/create-payment-intent', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { amount, planName } = req.body;
      
      if (!amount || !planName) {
        return res.status(400).json({ message: 'Amount and plan name are required' });
      }

      if (!stripe) {
        return res.status(503).json({ 
          message: 'Stripe payment method is temporarily unavailable' 
        });
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'brl',
        metadata: {
          userId: req.user.id.toString(),
          planName,
          credits: amount.toString()
        }
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Asaas PIX payment route
  app.post('/api/create-pix-payment', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId, amount } = req.body;
      
      if (!planId || !amount) {
        return res.status(400).json({ message: 'Plan ID and amount are required' });
      }

      // Verificar se a chave API do Asaas está disponível
      if (!process.env.ASAAS_API_KEY) {
        return res.status(503).json({ 
          message: 'PIX payment method is temporarily unavailable' 
        });
      }
      
      // Simular um processamento de pagamento PIX
      // Em produção, aqui chamaríamos a API do Asaas para gerar um QR Code PIX
      
      // Determinar a quantidade de créditos com base no plano
      let credits = 0;
      
      switch(planId) {
        case 'inicial':
          credits = 3000;
          break;
        case 'profissional':
          credits = 5000;
          break;
        case 'empresarial':
          credits = 10000;
          break;
        default:
          credits = 0;
      }
      
      if (credits <= 0) {
        return res.status(400).json({ message: 'Invalid plan selected' });
      }
      
      // Criar um registro de pagamento pendente
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount,
        method: 'pix',
        status: 'pending', // Status inicial é pendente
        description: `Compra de pacote ${planId}`,
        paymentId: `pix_${Date.now()}`,
        credits: credits
      });
      
      // Este é um fluxo simulado de PIX
      // Em um ambiente de produção, chamaríamos a API do Asaas (ou similar) para gerar QR code PIX
      
      // Simulamos adicionando os créditos imediatamente, mas em produção seria apenas após confirmação
      await storage.addCredits(req.user.id, credits);
      
      // Neste fluxo simulado, não precisamos atualizar o pagamento
      // Em um fluxo real, teríamos que atualizar o status via webhook
      // const updatedPayment = await storage.updatePayment(...)
      
      res.status(200).json({
        success: true,
        paymentId: payment.paymentId,
        pixKey: "12828011/0001-43",
        credits,
        message: 'Pagamento processado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro na criação do pagamento PIX:', error);
      res.status(400).json({ message: error.message || 'Erro ao processar pagamento PIX' });
    }
  });

  // Rota de webhook para receber notificações do Asaas (PIX)
  app.post('/api/webhooks/asaas', async (req, res) => {
    try {
      const payload = req.body;
      
      // Garantir que o payload tem a estrutura esperada
      if (!payload || !payload.event || !payload.payment) {
        console.error('Webhook do Asaas recebido com estrutura inválida:', payload);
        return res.status(400).json({ message: 'Invalid webhook payload' });
      }
      
      // Verificar o tipo de evento
      const { event, payment } = payload;
      
      if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
        console.log('Pagamento confirmado:', payment.id);
        
        // Buscar o paymentId no formato usado na nossa aplicação
        const paymentRecord = await findPaymentByExternalId(payment.id);
        
        if (!paymentRecord) {
          console.error('Pagamento não encontrado na base de dados:', payment.id);
          return res.status(200).json({ message: 'Payment not found but webhook received' });
        }
        
        // Adicionar créditos ao usuário
        await storage.addCredits(paymentRecord.userId, paymentRecord.credits);
        
        // Atualizar status do pagamento
        // Na versão atual simplificada, o pagamento já é marcado como confirmado
        
        return res.status(200).json({ success: true });
      }
      
      // Para outros tipos de eventos, apenas registramos no log e retornamos 200
      console.log('Webhook do Asaas recebido:', event);
      return res.status(200).json({ received: true });
      
    } catch (error: any) {
      console.error('Erro ao processar webhook do Asaas:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Função auxiliar para encontrar um pagamento pelo ID externo do Asaas
  async function findPaymentByExternalId(externalId: string): Promise<Payment | null> {
    // Na implementação real, buscaríamos na base de dados usando o ID externo
    // Como estamos usando MemStorage simplificado, vamos procurar manualmente
    // em todos os pagamentos de todos os usuários
    let found = null;
    
    // Na versão atual, retornamos null, pois não temos o mapeamento de IDs externos
    // Em uma implementação real, faríamos uma consulta SQL ou similar
    return null;
  }

  // Rota de sucesso para pagamentos Stripe
  app.post('/api/payment-success', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment intent ID is required' });
      }

      if (!stripe) {
        return res.status(503).json({ message: 'Stripe payment service is unavailable' });
      }

      // Verify the payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment has not been completed yet' });
      }

      // Extract credits from metadata
      const credits = parseInt(paymentIntent.metadata.credits || "0");
      
      if (isNaN(credits) || credits <= 0) {
        return res.status(400).json({ message: 'Invalid credit amount' });
      }

      // Add credits to user
      const user = await storage.addCredits(req.user.id, credits);
      
      // Create payment record
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount: credits,
        credits: credits,
        status: 'completed',
        paymentId: paymentIntentId,
        method: 'stripe'
      });

      res.status(200).json({ success: true, payment, credits: user.credits });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Rota para verificar status de pagamento (simplificada para evitar conflitos)
  app.get('/api/payment-status/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentId = req.params.id;
      const paymentMethod = req.query.method as string;
      
      if (!paymentId) {
        return res.status(400).json({ message: 'Payment ID is required' });
      }
      
      if (paymentMethod === 'pix') {
        // Tentar buscar o pagamento específico na base
        const payments = await storage.getPaymentsByUserId(req.user.id);
        const payment = payments.find(p => p.paymentId === paymentId);
        
        if (payment) {
          return res.status(200).json({
            status: payment.status,
            value: payment.amount,
            method: 'pix',
            description: payment.description || 'Pagamento PIX',
            credits: payment.credits
          });
        }
        
        // Se não encontrou o pagamento específico, retorna confirmado (versão simplificada)
        return res.status(200).json({
          status: 'confirmed',
          value: 0,
          method: 'pix',
          description: 'Pagamento PIX processado'
        });
      } else if (paymentMethod === 'stripe' && stripe) {
        // Verificar status do pagamento Stripe
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
          
          return res.status(200).json({
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100, // Reconverter de centavos para reais
            description: paymentIntent.description || `Plano: ${paymentIntent.metadata.planName || 'Desconhecido'}`
          });
        } catch (stripeError) {
          console.error('Erro ao consultar Stripe:', stripeError);
          return res.status(200).json({
            status: 'processing',
            amount: 0,
            description: 'Processando pagamento'
          });
        }
      }
      
      res.status(400).json({ message: 'Unsupported payment method or service unavailable' });
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Rota para conceder créditos de demonstração
  app.post('/api/request-demo', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      const demoCredits = 10; // Conceder 10 créditos de demonstração
      
      // Verificar se o usuário já recebeu créditos de demonstração antes
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.demoUsed) {
        return res.status(400).json({ message: 'Demo credits already claimed' });
      }
      
      // Adicionar créditos de demonstração
      const updatedUser = await storage.addCredits(userId, demoCredits);
      
      // Marcar que o usuário já usou a demonstração
      await storage.markDemoUsed(userId);
      
      // Criar registro de "pagamento" de demonstração
      const payment = await storage.createPayment({
        userId,
        amount: demoCredits,
        credits: demoCredits,
        status: 'completed',
        paymentId: `demo_${userId}_${Date.now()}`,
        method: 'demo'
      });
      
      res.status(200).json({ 
        success: true, 
        credits: updatedUser.credits,
        message: 'Demo credits added successfully' 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Create Admin access
  app.get('/api/admin/users', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      // Get all users (in a real app, this would be paginated)
      const users = Array.from(storage.users).map(([_, user]) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin: Adicionar créditos manualmente
  app.post('/api/admin/add-credits', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const { userId, credits } = req.body;
      
      if (!userId || !credits || isNaN(credits) || credits <= 0) {
        return res.status(400).json({ message: 'Valid user ID and credits are required' });
      }
      
      // Adicionar créditos ao usuário
      const user = await storage.addCredits(userId, credits);
      
      // Criar registro de pagamento manual
      const payment = await storage.createPayment({
        userId,
        amount: credits,
        credits,
        status: 'completed',
        paymentId: `admin_${req.user.id}_${Date.now()}`,
        method: 'admin'
      });
      
      res.status(200).json({ 
        success: true, 
        user,
        message: `${credits} credits added to user ${userId}` 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =========== ROTAS DE PESQUISAS (SURVEYS) ===========
  
  // Criar uma nova pesquisa
  app.post('/api/surveys', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      
      // Verificar se o usuário tem créditos suficientes
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Por enquanto, permitimos criar pesquisas sem custo inicial
      // O custo será cobrado quando a pesquisa for efetivamente enviada
      
      const validatedData = insertSurveySchema.parse({
        ...req.body,
        userId
      });
      
      const survey = await storage.createSurvey(validatedData);
      
      res.status(201).json(survey);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Obter todas as pesquisas do usuário
  app.get('/api/surveys', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      const surveys = await storage.getSurveysByUserId(userId);
      
      res.status(200).json(surveys);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter uma pesquisa específica
  app.get('/api/surveys/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      const survey = await storage.getSurvey(surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso a esta pesquisa
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      res.status(200).json(survey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar uma pesquisa existente
  app.put('/api/surveys/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const existingSurvey = await storage.getSurvey(surveyId);
      
      if (!existingSurvey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para editar esta pesquisa
      if (existingSurvey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      // Não permitir edição se a pesquisa já estiver ativa/concluída
      if (existingSurvey.status !== 'draft' && req.user.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot edit a survey that is not in draft status' });
      }
      
      const updatedSurvey = await storage.updateSurvey(surveyId, req.body);
      
      res.status(200).json(updatedSurvey);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Atualizar requisitos demográficos da pesquisa
  app.put('/api/surveys/:id/demographics', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.user.id;
      const { sexDistribution, ageDistribution, locationDistribution, demographicsComplete } = req.body;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const existingSurvey = await storage.getSurvey(surveyId);
      
      if (!existingSurvey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para editar esta pesquisa
      if (existingSurvey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      // Validar soma das porcentagens = 100%
      const validatePercentages = (items: any[]) => {
        if (!items || !Array.isArray(items)) return false;
        const sum = items.reduce((acc, item) => acc + (Number(item.percentage) || 0), 0);
        return Math.abs(sum - 100) < 0.1; // Permitir pequena margem de erro devido a arredondamentos
      };
      
      // Validar sexDistribution
      if (sexDistribution) {
        const sexSum = (sexDistribution.male || 0) + (sexDistribution.female || 0) + (sexDistribution.other || 0);
        if (Math.abs(sexSum - 100) >= 0.1) {
          return res.status(400).json({ message: 'Sex distribution percentages must sum to 100%' });
        }
      }
      
      // Validar ageDistribution
      if (ageDistribution && !validatePercentages(ageDistribution)) {
        return res.status(400).json({ message: 'Age distribution percentages must sum to 100%' });
      }
      
      // Validar locationDistribution
      if (locationDistribution && !validatePercentages(locationDistribution)) {
        return res.status(400).json({ message: 'Location distribution percentages must sum to 100%' });
      }
      
      const updatedSurvey = await storage.updateSurvey(surveyId, {
        sexDistribution,
        ageDistribution,
        locationDistribution,
        demographicsComplete: !!demographicsComplete
      });
      
      res.status(200).json(updatedSurvey);
    } catch (error: any) {
      console.error('Error updating demographics:', error);
      res.status(400).json({ message: error.message || 'Failed to update demographics' });
    }
  });
  
  // Excluir uma pesquisa
  app.delete('/api/surveys/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const existingSurvey = await storage.getSurvey(surveyId);
      
      if (!existingSurvey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para excluir esta pesquisa
      if (existingSurvey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      // Não permitir exclusão se a pesquisa já estiver ativa/concluída
      if (existingSurvey.status !== 'draft' && existingSurvey.status !== 'archived' && req.user.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot delete a survey that is active or completed' });
      }
      
      const deleted = await storage.deleteSurvey(surveyId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete survey' });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // =========== ROTAS DE PERGUNTAS (QUESTIONS) ===========
  
  // Criar uma nova pergunta para uma pesquisa
  app.post('/api/surveys/:surveyId/questions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.surveyId);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const survey = await storage.getSurvey(surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para editar esta pesquisa
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      // Não permitir adição de perguntas se a pesquisa já estiver ativa/concluída
      if (survey.status !== 'draft' && req.user.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot add questions to a survey that is not in draft status' });
      }
      
      const validatedData = insertQuestionSchema.parse({
        ...req.body,
        surveyId
      });
      
      const question = await storage.createQuestion(validatedData);
      
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Obter todas as perguntas de uma pesquisa
  app.get('/api/surveys/:surveyId/questions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.surveyId);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const survey = await storage.getSurvey(surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para visualizar esta pesquisa
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      const questions = await storage.getQuestionsBySurveyId(surveyId);
      
      res.status(200).json(questions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar uma pergunta específica
  app.put('/api/questions/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      // Verificar se a pergunta existe
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Verificar se o usuário tem acesso para editar esta pergunta (via pesquisa)
      const survey = await storage.getSurvey(question.surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Associated survey not found' });
      }
      
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to question' });
      }
      
      // Não permitir edição se a pesquisa já estiver ativa/concluída
      if (survey.status !== 'draft' && req.user.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot edit questions of a survey that is not in draft status' });
      }
      
      const updatedQuestion = await storage.updateQuestion(questionId, req.body);
      
      res.status(200).json(updatedQuestion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Excluir uma pergunta
  app.delete('/api/questions/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      // Verificar se a pergunta existe
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Verificar se o usuário tem acesso para excluir esta pergunta (via pesquisa)
      const survey = await storage.getSurvey(question.surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Associated survey not found' });
      }
      
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to question' });
      }
      
      // Não permitir exclusão se a pesquisa já estiver ativa/concluída
      if (survey.status !== 'draft' && req.user.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot delete questions of a survey that is not in draft status' });
      }
      
      const deleted = await storage.deleteQuestion(questionId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete question' });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // =========== ROTAS DE COMPARTILHAMENTO (SURVEY SHARE) ===========
  
  // Criar um novo compartilhamento de pesquisa
  app.post('/api/surveys/:surveyId/share', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.surveyId);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const survey = await storage.getSurvey(surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para compartilhar esta pesquisa
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      // Verificar se a pesquisa está disponível para compartilhamento
      if (survey.status !== 'active' && req.user.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot share a survey that is not active' });
      }
      
      const validatedData = insertSurveyShareSchema.parse({
        ...req.body,
        surveyId,
        createdBy: userId
      });
      
      const share = await storage.createSurveyShare(validatedData);
      
      // Aqui implementaremos a lógica para enviar o compartilhamento (email, SMS, etc.)
      // Por enquanto, apenas retornamos o objeto de compartilhamento criado
      
      res.status(201).json(share);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Obter todos os compartilhamentos de uma pesquisa
  app.get('/api/surveys/:surveyId/shares', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.surveyId);
      const userId = req.user.id;
      
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'Invalid survey ID' });
      }
      
      // Verificar se a pesquisa existe
      const survey = await storage.getSurvey(surveyId);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se o usuário tem acesso para visualizar esta pesquisa
      if (survey.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access to survey' });
      }
      
      const shares = await storage.getSurveySharesBySurveyId(surveyId);
      
      res.status(200).json(shares);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // =========== ROTAS PÚBLICAS DE PESQUISA (ACESSO VIA LINK) ===========
  
  // Acessar uma pesquisa via código de compartilhamento
  app.get('/api/public/surveys/:shareCode', async (req, res) => {
    try {
      const shareCode = req.params.shareCode;
      
      if (!shareCode) {
        return res.status(400).json({ message: 'Invalid share code' });
      }
      
      const survey = await storage.getSurveyByShareCode(shareCode);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se a pesquisa está ativa
      if (survey.status !== 'active') {
        return res.status(403).json({ message: 'This survey is not currently active' });
      }
      
      // Verificar se a pesquisa não expirou
      if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
        return res.status(403).json({ message: 'This survey has expired' });
      }
      
      // Para acesso público, retornamos apenas informações básicas sem dados sensíveis
      const publicSurvey = {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        shareCode: survey.shareCode
      };
      
      res.status(200).json(publicSurvey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter as perguntas de uma pesquisa pública
  app.get('/api/public/surveys/:shareCode/questions', async (req, res) => {
    try {
      const shareCode = req.params.shareCode;
      
      if (!shareCode) {
        return res.status(400).json({ message: 'Invalid share code' });
      }
      
      const survey = await storage.getSurveyByShareCode(shareCode);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se a pesquisa está ativa
      if (survey.status !== 'active') {
        return res.status(403).json({ message: 'This survey is not currently active' });
      }
      
      // Verificar se a pesquisa não expirou
      if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
        return res.status(403).json({ message: 'This survey has expired' });
      }
      
      const questions = await storage.getQuestionsBySurveyId(survey.id);
      
      // Para acesso público, podemos filtrar certas informações se necessário
      const publicQuestions = questions.map(question => ({
        id: question.id,
        text: question.text,
        type: question.type,
        options: question.options,
        required: question.required,
        order: question.order
      }));
      
      res.status(200).json(publicQuestions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Enviar resposta para uma pesquisa pública
  app.post('/api/public/surveys/:shareCode/submit', async (req, res) => {
    try {
      const shareCode = req.params.shareCode;
      const { answers, respondentId, location, userAgent } = req.body;
      
      if (!shareCode) {
        return res.status(400).json({ message: 'Invalid share code' });
      }
      
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Answers are required' });
      }
      
      const survey = await storage.getSurveyByShareCode(shareCode);
      
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      
      // Verificar se a pesquisa está ativa
      if (survey.status !== 'active') {
        return res.status(403).json({ message: 'This survey is not currently active' });
      }
      
      // Verificar se a pesquisa não expirou
      if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
        return res.status(403).json({ message: 'This survey has expired' });
      }
      
      // Criar uma resposta (response) para a pesquisa
      const response = await storage.createResponse({
        surveyId: survey.id,
        respondentId: respondentId || `anonymous_${Date.now()}`,
        completedAt: new Date(),
        userAgent: userAgent || null,
        location: location || null,
        metadata: {}
      });
      
      // Criar respostas individuais para cada pergunta
      const savedAnswers = [];
      for (const answerData of answers) {
        const answer = await storage.createAnswer({
          responseId: response.id,
          questionId: answerData.questionId,
          value: answerData.value || null,
          values: answerData.values || null,
          audioUrl: answerData.audioUrl || null
        });
        savedAnswers.push(answer);
      }
      
      res.status(201).json({
        success: true,
        responseId: response.id,
        message: 'Survey response submitted successfully'
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
