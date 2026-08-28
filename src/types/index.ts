// ─────────────────────────────────────────────────────────────────────────────
// Tipos alinhados com os schemas do backend BNFix (openapi.json)
// ─────────────────────────────────────────────────────────────────────────────

/** Roles do backend: ADMIN | MANAGER | USER  */
export type BackendRole = 'ADMIN' | 'MANAGER' | 'USER';

/** Roles internos do frontend para roteamento de dashboard */
export type UserRole = 'ADMIN' | 'SUPPLIER' | 'COMPANY' | 'EMPLOYEE';

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Perfil devolvido por /auth/login, /auth/switch-company e /auth/me.
 * O token em si vive apenas no cookie httpOnly — nunca exposto ao JS.
 */
export interface AuthMeResponse {
  accountId?: string;
  email: string;
  role: BackendRole;
  companyId?: number;
  companyName?: string;
  name?: string;
}

export interface SwitchCompanyRequest {
  companyId: number;
}

// ── Entidades do backend ─────────────────────────────────────────────────────

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  companyId?: number;
  companyName?: string;
  cpf?: string;
  active?: boolean;
}

export interface BackendBenefit {
  id: number;
  name?: string;
  benefitName?: string;
  description: string;
  companyId?: number;
  companyName?: string;
  nameProvider?: string;
  active?: boolean;
  status?: boolean;
  publiclyVisible?: boolean;
  /** Quando true, funcionários do próprio provider também podem resgatar. */
  availableToProviderEmployees?: boolean;
  validUntil?: string;
  maxUsesPerUser?: number;
  terms?: string;
  categories?: Array<{ id: number; name: string }>;
}

export interface BackendEmployee {
  id: number;
  name: string;
  cpf: string;
  email: string;
  companyId: number;
  active?: boolean;
}

export interface BackendManager {
  id: number;
  name: string;
  cpf?: string;
  email: string;
  companyId: number;
  active?: boolean;
}

export interface BackendCompany {
  id: number;
  name: string;
  cnpj: string;
  active?: boolean;
  /** Apenas a membership proprietária pode encerrar o tenant. */
  owner?: boolean;
}

export interface CreateCompanyPayload {
  name: string;
  cnpj: string;
}

export interface DeactivateCompanyPayload {
  password: string;
}

export interface UpdateCompanyPayload {
  name: string;
}

export interface UpdateManagerEmailPayload {
  email: string;
  currentPassword: string;
}

export interface ChangeManagerPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface BackendPartnership {
  id: number;
  clientCompanyId: number;
  clientCompanyName: string;
  benefitId: number;
  benefitName: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'DISABLED';
  createdAt?: string;
}

/**
 * Benefício disponível para o funcionário logado — resposta de GET /benefits/me.
 * A elegibilidade é derivada das parcerias ativas da empresa (avaliada em tempo real).
 */
export interface EmployeeBenefitResponse {
  benefitId: number;
  benefitName: string;
  description: string;
  providerName: string;
  categories: Array<{ id: number; name: string }>;
  validUntil?: string;
  maxUsesPerUser: number;
  usedCount: number;
  remainingUses: number;
  terms?: string;
}

// ── Tipos do frontend (mapeados a partir do backend) ─────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  backendRole?: BackendRole;
  companyId?: string;
  companyName?: string;
  avatarUrl?: string;
  // Gamificação (calculado localmente — backend não expõe esses campos)
  score?: number;
  level?: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';
}

export type BenefitCategory =
  | 'Saúde'
  | 'Educação'
  | 'Alimentação'
  | 'Transporte'
  | 'Bem-estar'
  | 'Tecnologia'
  | 'Lazer'
  | 'Psicologia'
  | 'Academias'
  | 'Telemedicina';

export interface Benefit {
  id: string;
  name: string;
  category: BenefitCategory;
  supplierId: string;
  supplierName: string;
  rating: number;
  ratingCount: number;
  description: string;
  imageUrl: string;
  details: string;
  status: 'Ativo' | 'Pendente' | 'Suspenso';
  rules?: string;
  /** ID original do backend (int64) */
  backendId?: number;
  companyId?: number;
  active?: boolean;
  /** Funcionários do próprio provider também podem resgatar. */
  availableToProviderEmployees?: boolean;
  /** Alias usado em alguns pontos do código legado */
  providerName?: string;
}

export interface Coupon {
  id: string;
  benefitId: string;
  benefitName: string;
  code: string;
  discount: string;
  description: string;
  expiryDate: string;
}

export interface Voucher {
  id: string;
  benefitId: string;
  benefitName: string;
  code: string;
  qrValue: string;
  expiryDate: string;
  employeeId: string;
  status: 'Ativo' | 'Utilizado' | 'Expirado';
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  status: 'Ativo' | 'Pendente' | 'Suspenso';
  employeesCount: number;
  hiredBenefitsCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  rating: number;
  benefitsCount: number;
  status: 'Ativo' | 'Pendente' | 'Suspenso';
}

export interface AnnouncementBase {
  id: number;
  title: string;
  content: string;
  publishedAt: string;
  author: string;
}

export interface ManagerAnnouncement extends AnnouncementBase {
  recipientCount: number;
}

export interface EmployeeAnnouncement extends AnnouncementBase {
  read: boolean;
  readAt: string | null;
}

export interface AnnouncementPage<T> {
  items: T[];
  page: number;
  size: number;
  hasMore: boolean;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
}

export interface UnreadAnnouncementCount {
  unreadCount: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'health' | 'wellness' | 'campaign' | 'internal';
  color: string;
  description: string;
}

export interface FeedbackRating {
  id: string;
  benefitId: string;
  employeeName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SurveyCampaign {
  id: string;
  title: string;
  description: string;
  period: string;
  status: 'Ativo' | 'Encerrado';
  sentBy: string;
  sentAt: string;
}

export interface SurveyResponse {
  id: string;
  campaignId: string;
  campaignTitle: string;
  employeeId: string;
  employeeName: string;
  nps: number;
  platformSatisfaction: number;
  benefitId?: string;
  benefitName?: string;
  benefitRating?: number;
  benefitComment?: string;
  submittedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: string;
}

// ── Requests de criação (alinhados ao OpenAPI) ───────────────────────────────

export interface CreateBenefitPayload {
  name: string;
  description: string;
  companyId: number;
  categoryIds?: number[];
  publiclyVisible?: boolean;
  /** Quando true, funcionários do próprio provider também podem resgatar. Default: false. */
  availableToProviderEmployees?: boolean;
  validUntil?: string;
  maxUsesPerUser?: number;
  terms?: string;
}

export interface UpdateBenefitPayload {
  name?: string;
  description?: string;
  publiclyVisible?: boolean;
  /** Quando true, funcionários do próprio provider também podem resgatar. */
  availableToProviderEmployees?: boolean;
  validUntil?: string;
  maxUsesPerUser?: number;
  terms?: string;
}

export interface CreateEmployeePayload {
  name: string;
  cpf: string;
  email: string;
  password: string;
  companyId: number;
}

export interface UpdateEmployeePayload {
  name?: string;
}

export interface CreateManagerPayload {
  name: string;
  cpf: string;
  email: string;
  password: string;
  companyId: number;
}

export interface OnboardingPayload {
  company: { name: string; cnpj: string };
  manager: { name: string; cpf: string; email: string; password: string };
}

export interface CreatePartnershipPayload {
  benefitId: number;
}

export interface RedemptionToken {
  token: string;
  redemptionUrl: string;
  expiresAt: string;
}

export interface RedemptionPreview {
  valid: boolean;
  benefitName: string;
  beneficiaryName: string;
  providerName: string;
  expiresAt: string;
  message: string;
}

export interface RedemptionResult {
  id: number;
  benefitName: string;
  beneficiaryName: string;
  redeemedAt: string;
}
