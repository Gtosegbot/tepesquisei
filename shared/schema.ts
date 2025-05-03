import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabela de usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  credits: integer("credits").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  demoUsed: boolean("demo_used").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Tabela de pagamentos
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  credits: integer("credits").notNull(),
  paymentId: text("payment_id"),
  status: text("status").notNull(),
  method: text("method").default("stripe"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  amount: true,
  credits: true,
  paymentId: true,
  status: true,
  method: true,
  description: true,
});

// Tabela de pesquisas
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, completed, archived
  userId: integer("user_id").notNull(),
  targetAudience: text("target_audience"), // Descrição do público-alvo
  filters: jsonb("filters"), // Filtros demográficos em JSON
  demographicsComplete: boolean("demographics_complete").default(false), // Se as perguntas demográficas obrigatórias foram preenchidas
  // Campos para armazenar os requisitos demográficos
  sexDistribution: jsonb("sex_distribution"), // Distribuição por sexo (masculino/feminino/outros)
  ageDistribution: jsonb("age_distribution"), // Distribuição por faixa etária
  locationDistribution: jsonb("location_distribution"), // Distribuição por localização geográfica
  shareCode: text("share_code").notNull().unique(), // Código único para compartilhamento
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Data de expiração da pesquisa
  creditsUsed: integer("credits_used").notNull().default(0), // Quantidade de créditos utilizados
});

export const insertSurveySchema = createInsertSchema(surveys).pick({
  title: true,
  description: true,
  userId: true,
  targetAudience: true,
  filters: true,
  demographicsComplete: true,
  sexDistribution: true,
  ageDistribution: true,
  locationDistribution: true,
  shareCode: true,
  expiresAt: true,
  status: true,
});

// Tabela de perguntas da pesquisa
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull(), // single_choice, multiple_choice, open_text, scale, demographic
  options: jsonb("options"), // Opções de resposta em JSON
  required: boolean("required").notNull().default(true),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  surveyId: true,
  text: true,
  type: true,
  options: true,
  required: true,
  order: true,
});

// Tabela de respostas da pesquisa
export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull(),
  respondentId: text("respondent_id").notNull(), // Identificador único do respondente (pode ser anônimo)
  completedAt: timestamp("completed_at").notNull(),
  userAgent: text("user_agent"), // Informações do navegador/dispositivo
  location: jsonb("location"), // Dados de geolocalização em JSON
  metadata: jsonb("metadata"), // Metadados adicionais em JSON
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  surveyId: true,
  respondentId: true,
  completedAt: true,
  userAgent: true,
  location: true,
  metadata: true,
});

// Tabela de respostas das perguntas
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  responseId: integer("response_id").notNull(),
  questionId: integer("question_id").notNull(),
  value: text("value"), // Resposta textual
  values: jsonb("values"), // Para respostas múltiplas em JSON
  audioUrl: text("audio_url"), // URL para gravação de áudio (se aplicável)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  responseId: true,
  questionId: true,
  value: true,
  values: true,
  audioUrl: true,
});

// Tabela de convites/compartilhamentos de pesquisa
export const surveyShares = pgTable("survey_shares", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull(),
  type: text("type").notNull(), // email, sms, whatsapp, link
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  createdBy: integer("created_by").notNull(), // ID do usuário que criou o compartilhamento
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSurveyShareSchema = createInsertSchema(surveyShares).pick({
  surveyId: true,
  type: true,
  recipientEmail: true,
  recipientPhone: true,
  message: true,
  createdBy: true,
});

// Tipos inferidos para uso no sistema
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveys.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertSurveyShare = z.infer<typeof insertSurveyShareSchema>;
export type SurveyShare = typeof surveyShares.$inferSelect;
