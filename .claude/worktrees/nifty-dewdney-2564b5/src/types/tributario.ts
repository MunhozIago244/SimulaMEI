// Tipos centrais do motor tributario SimulaMEI
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'

export type Anexo = 'I' | 'II' | 'III' | 'IV' | 'V'
export type RegimeTributario = 'simples' | 'presumido' | 'real'
export type TipoMei = 'geral' | 'caminhoneiro'
export type CenarioExcesso = 'dentro_limite' | 'excesso_leve' | 'excesso_grave'
export type CnaeCategoriaFiscal = 'comercio' | 'industria' | 'servicos' | 'construcao' | 'ti_consultoria'

export interface Faixa {
  faixa: number
  limiteSuperior: number
  aliquotaNominal: number
  parcelaDeduzir: number
}

export interface ResultadoAliquota {
  rbt12: number
  faixa: number
  aliquotaNominal: number
  parcelaDeduzir: number
  aliquotaEfetiva: number
  dasAnual: number
  dasMensal: number
}

export interface ResultadoFatorR {
  folha12meses: number
  rbt12: number
  fatorR: number
  fatorRPercent: number
  atingeMinimo: boolean // >= 28%
  anexoResultante: 'III' | 'V'
  proLaboreMinimo: number // valor mensal minimo para atingir 28%
  economiaAnual: number  // diferenca entre Anexo V e III se elegivel
}

export interface AlertaTeto {
  faturamentoAcumulado: number
  tetoAnual: number
  tipoMei: TipoMei
  projecaoAnual: number
  diferenca: number
  percentualUtilizado: number
  mesesRestantes: number
  mesesParaTeto: number | null // null se ja ultrapassou
  mesEstourarTeto: number | null
  cenario: CenarioExcesso
  excessoProjetado: number
  percentualExcesso: number
}

export interface ResultadoPresumido {
  receitaAnual: number
  categoria: CnaeCategoriaFiscal
  presuncaoUtilizada: number       // ex: 0.08 (comercio) ou 0.32 (servicos)
  irpj: number
  csll: number
  pis: number
  cofins: number
  iss: number                       // 0 para comercio/industria
  total: number                     // soma dos tributos federais/municipais
  aliquotaEfetiva: number           // total / receitaAnual
  inssProLabore: number             // INSS do socio 11% x pro-labore x 12
  inssPatronal: number              // INSS patronal 20% x pro-labore x 12
  custoTotal: number                // total + inssProLabore + inssPatronal
  aliquotaEfetivaCustoTotal: number // custoTotal / receitaAnual
}

export interface ResultadoReal {
  receitaAnual: number
  margemLiquida: number
  lucroEstimado: number
  categoria: CnaeCategoriaFiscal
  irpj: number
  csll: number
  pis: number
  cofins: number
  iss: number                       // 0 para comercio/industria
  total: number
  aliquotaEfetiva: number
  inssProLabore: number
  inssPatronal: number
  custoTotal: number
  aliquotaEfetivaCustoTotal: number
}

export interface ResultadoCLT {
  salarioBruto: number              // mensal equivalente (receitaAnual / 12)
  salarioBrutoAnual: number         // incluindo 13o salario
  inssEmpregadoMensal: number
  inssEmpregadoAnual: number
  irrfMensal: number
  irrfAnual: number
  salarioLiquidoMensal: number
  salarioLiquidoAnual: number
  fgtsAnual: number
  decimoTerceiro: number            // valor bruto do 13o salario
  feriasComTerco: number            // 1 salario + 1/3
  custoEmpregadorAnual: number      // custo total para o empregador
  encargosEmpregadoAnual: number    // INSS + IRRF anuais (onus do empregado)
}

export interface ComparativoRegimes {
  simplesAnexoAtual: ResultadoAliquota & { anexo: Anexo }
  simplesAnexoOtimo?: ResultadoAliquota & { anexo: Anexo } // se ha troca de Anexo disponivel
  presumido: ResultadoPresumido
  real: ResultadoReal
  clt?: ResultadoCLT
  melhorRegime: 'simplesAtual' | 'simplesOtimo' | 'presumido' | 'real'
  economiaVsMelhor: number
}

export interface EntradaSimulacao {
  faturamentoAcumulado: number
  mesAtual: number // 1-12
  cnae: string
  folhaMensal: number // 0 se nao tem funcionario/pro-labore
  tipoMei: TipoMei
}

export interface ResultadoSimulacao {
  entrada: EntradaSimulacao
  alertaTeto: AlertaTeto
  fatorR: ResultadoFatorR | null // null se CNAE nao e elegivel
  anexoAtual: Anexo
  comparativo: ComparativoRegimes
  taxRuleVersion: string
  geradoEm: string
}

export interface CnaeInfo {
  cnae: string
  descricao: string
  anexoPadrao: Anexo
  elegivelFatorR: boolean
  categoria: 'comercio' | 'industria' | 'servicos' | 'construcao' | 'ti_consultoria'
  classificacaoTributaria?: 'curada' | 'pendente'
}
