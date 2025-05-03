import { 
  users, type User, type InsertUser, 
  payments, type Payment, type InsertPayment,
  surveys, type Survey, type InsertSurvey,
  questions, type Question, type InsertQuestion,
  responses, type Response, type InsertResponse,
  answers, type Answer, type InsertAnswer,
  surveyShares, type SurveyShare, type InsertSurveyShare
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { nanoid } from 'nanoid';

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserCredentials(email: string, password: string): Promise<User | null>;
  addCredits(userId: number, credits: number): Promise<User>;
  markDemoUsed(userId: number): Promise<User>;
  
  // Pagamentos
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  
  // Pesquisas
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  getSurvey(id: number): Promise<Survey | undefined>;
  getSurveyByShareCode(shareCode: string): Promise<Survey | undefined>;
  updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey>;
  deleteSurvey(id: number): Promise<boolean>;
  getSurveysByUserId(userId: number): Promise<Survey[]>;
  
  // Perguntas
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: number): Promise<boolean>;
  getQuestionsBySurveyId(surveyId: number): Promise<Question[]>;
  
  // Respostas (da pesquisa)
  createResponse(response: InsertResponse): Promise<Response>;
  getResponse(id: number): Promise<Response | undefined>;
  getResponsesBySurveyId(surveyId: number): Promise<Response[]>;
  
  // Respostas (das perguntas)
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByResponseId(responseId: number): Promise<Answer[]>;
  getAnswersByQuestionId(questionId: number): Promise<Answer[]>;
  
  // Compartilhamentos
  createSurveyShare(share: InsertSurveyShare): Promise<SurveyShare>;
  getSurveySharesBySurveyId(surveyId: number): Promise<SurveyShare[]>;
  updateSurveyShareStatus(id: number, status: string, sentAt?: Date): Promise<SurveyShare>;
}

export class MemStorage implements IStorage {
  users: Map<number, User>;
  private payments: Map<number, Payment>;
  private surveys: Map<number, Survey>;
  private questions: Map<number, Question>;
  private responses: Map<number, Response>;
  private answers: Map<number, Answer>;
  private surveyShares: Map<number, SurveyShare>;
  
  currentUserId: number;
  currentPaymentId: number;
  currentSurveyId: number;
  currentQuestionId: number;
  currentResponseId: number;
  currentAnswerId: number;
  currentShareId: number;

  constructor() {
    this.users = new Map();
    this.payments = new Map();
    this.surveys = new Map();
    this.questions = new Map();
    this.responses = new Map();
    this.answers = new Map();
    this.surveyShares = new Map();
    
    this.currentUserId = 1;
    this.currentPaymentId = 1;
    this.currentSurveyId = 1;
    this.currentQuestionId = 1;
    this.currentResponseId = 1;
    this.currentAnswerId = 1;
    this.currentShareId = 1;

    // Add admin user
    this.createUser({
      username: "admin",
      email: "disparoseguroback@gmail.com",
      password: "Bot241223seGgto!!",
      role: "admin"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = { 
      id, 
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role || "user",
      credits: 0,
      isActive: true,
      lastLogin: null,
      demoUsed: false
    };
    
    this.users.set(id, user);
    return user;
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user) return null;
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) return null;
    
    // Update last login
    user.lastLogin = new Date();
    this.users.set(user.id, user);
    
    return user;
  }

  async addCredits(userId: number, credits: number): Promise<User> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    user.credits += credits;
    this.users.set(userId, user);
    
    return user;
  }

  async markDemoUsed(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    user.demoUsed = true;
    this.users.set(userId, user);
    
    return user;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    
    const newPayment: Payment = {
      id,
      userId: payment.userId,
      amount: payment.amount,
      credits: payment.credits,
      status: payment.status,
      paymentId: payment.paymentId || null,
      method: payment.method || "stripe",
      description: payment.description || null,
      createdAt: new Date()
    };
    
    this.payments.set(id, newPayment);
    
    // Add credits to user
    await this.addCredits(payment.userId, payment.credits);
    
    return newPayment;
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );
  }

  // Métodos de pesquisa (Survey)
  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const id = this.currentSurveyId++;
    const shareCode = nanoid(10); // Código de 10 caracteres para compartilhamento
    
    const newSurvey: Survey = {
      id,
      title: survey.title,
      description: survey.description || '',
      status: survey.status || 'draft',
      userId: survey.userId,
      targetAudience: survey.targetAudience || '',
      filters: survey.filters || {},
      demographicsComplete: survey.demographicsComplete || false,
      sexDistribution: survey.sexDistribution || null,
      ageDistribution: survey.ageDistribution || null,
      locationDistribution: survey.locationDistribution || null,
      shareCode: survey.shareCode || shareCode,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: survey.expiresAt || null,
      creditsUsed: 0
    };
    
    this.surveys.set(id, newSurvey);
    return newSurvey;
  }
  
  async getSurvey(id: number): Promise<Survey | undefined> {
    return this.surveys.get(id);
  }
  
  async getSurveyByShareCode(shareCode: string): Promise<Survey | undefined> {
    return Array.from(this.surveys.values()).find(
      (survey) => survey.shareCode === shareCode
    );
  }
  
  async updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey> {
    const existingSurvey = await this.getSurvey(id);
    
    if (!existingSurvey) {
      throw new Error("Survey not found");
    }
    
    const updatedSurvey: Survey = {
      ...existingSurvey,
      ...survey,
      updatedAt: new Date()
    };
    
    this.surveys.set(id, updatedSurvey);
    return updatedSurvey;
  }
  
  async deleteSurvey(id: number): Promise<boolean> {
    return this.surveys.delete(id);
  }
  
  async getSurveysByUserId(userId: number): Promise<Survey[]> {
    return Array.from(this.surveys.values()).filter(
      (survey) => survey.userId === userId
    );
  }
  
  // Métodos de perguntas (Question)
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    
    const newQuestion: Question = {
      id,
      surveyId: question.surveyId,
      text: question.text,
      type: question.type,
      options: question.options || {},
      required: question.required !== undefined ? question.required : true,
      order: question.order,
      createdAt: new Date()
    };
    
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question> {
    const existingQuestion = await this.getQuestion(id);
    
    if (!existingQuestion) {
      throw new Error("Question not found");
    }
    
    const updatedQuestion: Question = {
      ...existingQuestion,
      ...question
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  async getQuestionsBySurveyId(surveyId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter((question) => question.surveyId === surveyId)
      .sort((a, b) => a.order - b.order);
  }
  
  // Métodos de respostas da pesquisa (Response)
  async createResponse(response: InsertResponse): Promise<Response> {
    const id = this.currentResponseId++;
    
    const newResponse: Response = {
      id,
      surveyId: response.surveyId,
      respondentId: response.respondentId,
      completedAt: response.completedAt,
      userAgent: response.userAgent || null,
      location: response.location || {},
      metadata: response.metadata || {}
    };
    
    this.responses.set(id, newResponse);
    return newResponse;
  }
  
  async getResponse(id: number): Promise<Response | undefined> {
    return this.responses.get(id);
  }
  
  async getResponsesBySurveyId(surveyId: number): Promise<Response[]> {
    return Array.from(this.responses.values()).filter(
      (response) => response.surveyId === surveyId
    );
  }
  
  // Métodos de respostas das perguntas (Answer)
  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const id = this.currentAnswerId++;
    
    const newAnswer: Answer = {
      id,
      responseId: answer.responseId,
      questionId: answer.questionId,
      value: answer.value || null,
      values: answer.values || null,
      audioUrl: answer.audioUrl || null,
      createdAt: new Date()
    };
    
    this.answers.set(id, newAnswer);
    return newAnswer;
  }
  
  async getAnswersByResponseId(responseId: number): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(
      (answer) => answer.responseId === responseId
    );
  }
  
  async getAnswersByQuestionId(questionId: number): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(
      (answer) => answer.questionId === questionId
    );
  }
  
  // Métodos de compartilhamento (Survey Share)
  async createSurveyShare(share: InsertSurveyShare): Promise<SurveyShare> {
    const id = this.currentShareId++;
    
    const newShare: SurveyShare = {
      id,
      surveyId: share.surveyId,
      type: share.type,
      recipientEmail: share.recipientEmail || null,
      recipientPhone: share.recipientPhone || null,
      message: share.message || null,
      status: 'pending',
      sentAt: null,
      createdBy: share.createdBy,
      createdAt: new Date()
    };
    
    this.surveyShares.set(id, newShare);
    return newShare;
  }
  
  async getSurveySharesBySurveyId(surveyId: number): Promise<SurveyShare[]> {
    return Array.from(this.surveyShares.values()).filter(
      (share) => share.surveyId === surveyId
    );
  }
  
  async updateSurveyShareStatus(id: number, status: string, sentAt?: Date): Promise<SurveyShare> {
    const share = this.surveyShares.get(id);
    
    if (!share) {
      throw new Error("Survey share not found");
    }
    
    const updatedShare: SurveyShare = {
      ...share,
      status,
      sentAt: sentAt || (status === 'sent' ? new Date() : share.sentAt)
    };
    
    this.surveyShares.set(id, updatedShare);
    return updatedShare;
  }
}

export const storage = new MemStorage();
