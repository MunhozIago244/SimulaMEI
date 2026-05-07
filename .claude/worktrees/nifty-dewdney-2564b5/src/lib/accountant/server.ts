import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EntradaSimulacao, ResultadoSimulacao } from '@/types/tributario'
import {
  OFFICE_CLIENT_PAGE_SIZE,
  type OfficeClientStatusFilter,
} from './clients'
import type { AccountantMemberRole, AccountantOfficePlan } from './office'

export interface CurrentAccountantOffice {
  id: string
  name: string
  plan: AccountantOfficePlan
  max_clients: number
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_subscription_status: string | null
  current_period_end: string | null
  role: AccountantMemberRole
}

export interface OfficeClientRecord {
  id: string
  name: string
  email: string | null
  cnae: string
  tipo_mei: string
  uf: string | null
  municipio: string | null
  observacoes: string | null
  ativo: boolean
  inactive_reason: 'manual' | 'plan_limit' | null
  disabled_by_plan_limit_at: string | null
  created_at: string
  updated_at: string
}

export interface OfficeClientStats {
  total: number
  active: number
  manualInactive: number
  planLimitInactive: number
}

export interface OfficeSimulationRecord {
  id: string
  office_id: string
  client_id: string
  performed_by: string | null
  entrada: EntradaSimulacao
  resultado: ResultadoSimulacao
  tax_rule_version: string | null
  created_at: string
}

export interface OfficeAlertPayloadRecord {
  title?: string
  body?: string
  severity?: 'info' | 'warn' | 'danger'
  clientName?: string
  [key: string]: unknown
}

export interface OfficeAlertRecord {
  id: string
  office_id: string
  client_id: string
  tipo: string
  mes_referencia: string
  payload: OfficeAlertPayloadRecord
  notificado_em: string | null
  resolved_at: string | null
  resolved_by: string | null
  resolved_by_label: string | null
  created_at: string
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface OfficeMemberJoinRow {
  role: AccountantMemberRole
  accountant_offices: {
    id: string
    name: string
    plan: AccountantOfficePlan
    max_clients: number
    trial_ends_at: string | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    stripe_subscription_status: string | null
    current_period_end: string | null
  } | null
}

interface DbError {
  message: string
}

interface QueryResult<T> {
  data: T
  error: DbError | null
  count?: number | null
}

interface OfficeClientQuery<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: unknown): OfficeClientQuery<T>
  order(column: string, options?: { ascending?: boolean }): OfficeClientQuery<T>
  range(from: number, to: number): Promise<QueryResult<T>>
  limit(count: number): OfficeClientQuery<T>
  maybeSingle(): Promise<QueryResult<T | null>>
}

interface OfficeClientsTable {
  select<T = OfficeClientRecord[]>(
    columns: string,
    options?: { count?: 'exact'; head?: boolean },
  ): OfficeClientQuery<T>
}

interface OfficeSimulationsTable {
  select<T = OfficeSimulationRecord[]>(columns: string): OfficeClientQuery<T>
}

interface OfficeAlertQuery<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: unknown): OfficeAlertQuery<T>
  is(column: string, value: unknown): OfficeAlertQuery<T>
  not(column: string, operator: string, value: unknown): OfficeAlertQuery<T>
  order(column: string, options?: { ascending?: boolean }): OfficeAlertQuery<T>
  limit(count: number): Promise<QueryResult<T>>
}

interface OfficeAlertsTable {
  select<T = OfficeAlertRecord[]>(columns: string): OfficeAlertQuery<T>
}

interface UserProfileQuery<T> extends PromiseLike<QueryResult<T>> {
  in(column: string, values: unknown[]): Promise<QueryResult<T>>
}

interface UserProfilesTable {
  select<T = Array<{ id: string; email: string; nome: string | null }>>(columns: string): UserProfileQuery<T>
}

const OFFICE_CLIENT_COLUMNS = 'id, name, email, cnae, tipo_mei, uf, municipio, observacoes, ativo, inactive_reason, disabled_by_plan_limit_at, created_at, updated_at'
const OFFICE_SIMULATION_COLUMNS = 'id, office_id, client_id, performed_by, entrada, resultado, tax_rule_version, created_at'
const OFFICE_ALERT_COLUMNS = 'id, office_id, client_id, tipo, mes_referencia, payload, notificado_em, resolved_at, resolved_by, created_at'

export async function getCurrentAccountantOffice(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ office: CurrentAccountantOffice | null; error: string | null }> {
  const { data, error } = await supabase
    .from('office_members')
    .select('role, accountant_offices(id, name, plan, max_clients, trial_ends_at, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, current_period_end)')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { office: null, error: error.message }
  }

  const row = data as unknown as OfficeMemberJoinRow | null
  const office = row?.accountant_offices

  if (!row || !office) {
    return { office: null, error: null }
  }

  return {
    office: {
      id: office.id,
      name: office.name,
      plan: office.plan,
      max_clients: office.max_clients,
      trial_ends_at: office.trial_ends_at,
      stripe_customer_id: office.stripe_customer_id,
      stripe_subscription_id: office.stripe_subscription_id,
      stripe_subscription_status: office.stripe_subscription_status,
      current_period_end: office.current_period_end,
      role: row.role,
    },
    error: null,
  }
}

function getOfficeClientsTable() {
  return createAdminClient().from('office_clients') as unknown as OfficeClientsTable
}

function getOfficeSimulationsTable() {
  return createAdminClient().from('office_simulations') as unknown as OfficeSimulationsTable
}

function getOfficeAlertsTable(admin = createAdminClient()) {
  return admin.from('office_alerts') as unknown as OfficeAlertsTable
}

function getUserProfilesTable(admin = createAdminClient()) {
  return admin.from('user_profiles') as unknown as UserProfilesTable
}

function applyStatusFilter<T>(
  query: OfficeClientQuery<T>,
  status: OfficeClientStatusFilter,
) {
  if (status === 'active') return query.eq('ativo', true)
  if (status === 'inactive') return query.eq('ativo', false)
  if (status === 'manual') return query.eq('inactive_reason', 'manual')
  if (status === 'plan_limit') return query.eq('inactive_reason', 'plan_limit')
  return query
}

async function countOfficeClients(
  officeId: string,
  filter?: (query: OfficeClientQuery<null>) => OfficeClientQuery<null>,
) {
  const table = getOfficeClientsTable()
  let query = table
    .select<null>('id', { count: 'exact', head: true })
    .eq('office_id', officeId)

  if (filter) {
    query = filter(query)
  }

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getOfficeClientStats(officeId: string): Promise<OfficeClientStats> {
  const [total, active, manualInactive, planLimitInactive] = await Promise.all([
    countOfficeClients(officeId),
    countOfficeClients(officeId, query => query.eq('ativo', true)),
    countOfficeClients(officeId, query => query.eq('inactive_reason', 'manual')),
    countOfficeClients(officeId, query => query.eq('inactive_reason', 'plan_limit')),
  ])

  return { total, active, manualInactive, planLimitInactive }
}

export async function listOfficeClients(
  officeId: string,
  options?: { status?: OfficeClientStatusFilter; page?: number; pageSize?: number },
) {
  const page = options?.page && options.page > 0 ? options.page : 1
  const pageSize = options?.pageSize ?? OFFICE_CLIENT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const table = getOfficeClientsTable()
  const query = applyStatusFilter(
    table
      .select<OfficeClientRecord[]>(OFFICE_CLIENT_COLUMNS, { count: 'exact' })
      .eq('office_id', officeId),
    options?.status ?? 'all',
  )

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    clients: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  }
}

export async function getOfficeClientById(officeId: string, clientId: string) {
  const table = getOfficeClientsTable()
  const { data, error } = await table
    .select<OfficeClientRecord>(OFFICE_CLIENT_COLUMNS)
    .eq('office_id', officeId)
    .eq('id', clientId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function listOfficeClientSimulations(
  officeId: string,
  clientId: string,
  limit = 8,
) {
  const table = getOfficeSimulationsTable()
  const { data, error } = await table
    .select<OfficeSimulationRecord[]>(OFFICE_SIMULATION_COLUMNS)
    .eq('office_id', officeId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listOfficeAlerts(
  officeId: string,
  options?: { status?: 'open' | 'resolved' | 'all'; limit?: number },
) {
  const admin = createAdminClient()
  const status = options?.status ?? 'open'
  const limit = options?.limit ?? 6
  const table = getOfficeAlertsTable(admin)
  let query = table
    .select<OfficeAlertRecord[]>(OFFICE_ALERT_COLUMNS)
    .eq('office_id', officeId)

  if (status === 'open') {
    query = query.is('resolved_at', null)
  }

  if (status === 'resolved') {
    query = query.not('resolved_at', 'is', null)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const resolverIds = Array.from(new Set(rows.map(row => row.resolved_by).filter(Boolean))) as string[]
  if (resolverIds.length === 0) {
    return rows.map(row => ({ ...row, resolved_by_label: null }))
  }

  const profilesTable = getUserProfilesTable(admin)
  const profilesResult = await profilesTable
    .select('id, email, nome')
    .in('id', resolverIds)

  if (profilesResult.error) throw new Error(profilesResult.error.message)

  const profileLabels = new Map(
    (profilesResult.data ?? []).map(profile => [
      profile.id,
      profile.nome || profile.email,
    ]),
  )

  return rows.map(row => ({
    ...row,
    resolved_by_label: row.resolved_by ? profileLabels.get(row.resolved_by) ?? row.resolved_by : null,
  }))
}
