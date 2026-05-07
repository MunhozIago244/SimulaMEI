'use client'

import { FormEvent, KeyboardEvent, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CnaeInfo } from '@/types/tributario'
import type { UserProfileOnboarding } from '@/lib/onboarding'
import { BRAZIL_UF_OPTIONS, ONBOARDING_OBJECTIVES } from '@/constants/onboarding'
import { parsePtBrNumber } from '@/lib/number'
import { CnaeAutocomplete } from '@/components/simulador/CnaeAutocomplete'

interface OnboardingWizardProps {
  email: string
  profile: Partial<UserProfileOnboarding> | null
  initialCnae: CnaeInfo | null
}

type WizardState = 'idle' | 'saving' | 'error'

const currentMonth = new Date().getMonth() + 1

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block',
      marginBottom: 7,
      color: 'var(--text2)',
      fontSize: 12,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0,
    }}>
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '11px 12px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border2)',
        background: 'var(--bg2)',
        color: 'var(--text1)',
        outline: 'none',
        fontSize: 14,
        ...props.style,
      }}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '11px 12px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border2)',
        background: 'var(--bg2)',
        color: 'var(--text1)',
        outline: 'none',
        fontSize: 14,
        ...props.style,
      }}
    />
  )
}

export function OnboardingWizard({ email, profile, initialCnae }: OnboardingWizardProps) {
  const router = useRouter()
  const idBase = useId()
  const headerRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [active, setActive] = useState(0)
  const [state, setState] = useState<WizardState>('idle')
  const [error, setError] = useState('')
  const [cnae, setCnae] = useState<CnaeInfo | null>(initialCnae)

  const [form, setForm] = useState({
    nome: profile?.nome ?? '',
    nomeNegocio: profile?.nome_negocio ?? '',
    telefone: profile?.telefone ?? '',
    tipoMei: profile?.tipo_mei ?? 'geral',
    municipio: profile?.municipio ?? '',
    uf: profile?.uf ?? 'SP',
    faturamentoMensalEstimado: String(profile?.faturamento_mensal_estimado ?? ''),
    faturamentoAcumuladoAtual: String(profile?.faturamento_acumulado_atual ?? ''),
    folhaMensal: String(profile?.folha_mensal ?? '0'),
    mesAtual: String(profile?.mes_atual ?? currentMonth),
    objetivoPrincipal: profile?.objetivo_principal ?? ONBOARDING_OBJECTIVES[0],
  })

  function setValue(name: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [name]: value }))
  }

  const cardStatus = useMemo(() => {
    return [
      Boolean(form.nome && form.nomeNegocio && form.telefone),
      Boolean(cnae && form.tipoMei && form.municipio && form.uf),
      Boolean(form.faturamentoAcumuladoAtual !== '' && form.folhaMensal !== '' && form.mesAtual),
      Boolean(form.objetivoPrincipal),
    ]
  }, [cnae, form])

  const completion = cardStatus.filter(Boolean).length
  const complete = completion === 4
  const fieldIds = {
    nome: `${idBase}-nome`,
    nomeNegocio: `${idBase}-nome-negocio`,
    telefone: `${idBase}-telefone`,
    cnae: `${idBase}-cnae`,
    tipoMei: `${idBase}-tipo-mei`,
    uf: `${idBase}-uf`,
    municipio: `${idBase}-municipio`,
    faturamentoAcumuladoAtual: `${idBase}-faturamento-acumulado`,
    mesAtual: `${idBase}-mes-atual`,
    faturamentoMensalEstimado: `${idBase}-faturamento-mensal`,
    folhaMensal: `${idBase}-folha-mensal`,
  }

  function focusCard(index: number) {
    setActive(index)
    headerRefs.current[index]?.focus()
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number, total: number) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        focusCard((index + 1) % total)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        focusCard((index - 1 + total) % total)
        break
      case 'Home':
        event.preventDefault()
        focusCard(0)
        break
      case 'End':
        event.preventDefault()
        focusCard(total - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        setActive(index)
        break
      default:
        break
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!cnae || !complete) {
      setError('Complete todos os cards para liberar o dashboard.')
      return
    }

    setState('saving')

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        nomeNegocio: form.nomeNegocio,
        telefone: form.telefone,
        cnaePrincipal: cnae.cnae,
        tipoMei: form.tipoMei,
        municipio: form.municipio,
        uf: form.uf,
        faturamentoMensalEstimado: parsePtBrNumber(form.faturamentoMensalEstimado),
        faturamentoAcumuladoAtual: parsePtBrNumber(form.faturamentoAcumuladoAtual),
        folhaMensal: parsePtBrNumber(form.folhaMensal),
        mesAtual: Number(form.mesAtual),
        objetivoPrincipal: form.objetivoPrincipal,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Erro ao salvar pré-cadastro.' }))
      setError(payload.error ?? 'Erro ao salvar pré-cadastro.')
      setState('error')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const cards = [
    {
      title: 'Quem opera o MEI',
      text: 'Dados para personalizar alertas, relatórios e contato operacional.',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <FieldLabel htmlFor={fieldIds.nome}>Nome do responsável</FieldLabel>
            <Input id={fieldIds.nome} value={form.nome} onChange={event => setValue('nome', event.target.value)} placeholder="Seu nome completo" required />
          </div>
          <div>
            <FieldLabel htmlFor={fieldIds.nomeNegocio}>Nome do negócio</FieldLabel>
            <Input id={fieldIds.nomeNegocio} value={form.nomeNegocio} onChange={event => setValue('nomeNegocio', event.target.value)} placeholder="Ex.: Studio Fiscal Digital" required />
          </div>
          <div>
            <FieldLabel htmlFor={fieldIds.telefone}>Telefone/WhatsApp</FieldLabel>
            <Input id={fieldIds.telefone} value={form.telefone} onChange={event => setValue('telefone', event.target.value)} placeholder="(11) 99999-9999" required />
          </div>
        </div>
      ),
    },
    {
      title: 'Atividade fiscal',
      text: 'CNAE e localização definem o ponto de partida do diagnóstico.',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <FieldLabel htmlFor={fieldIds.cnae}>CNAE principal</FieldLabel>
            <CnaeAutocomplete inputId={fieldIds.cnae} value={cnae} onChange={setCnae} origin="/onboarding" />
          </div>
          <div className="onboarding-duo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel htmlFor={fieldIds.tipoMei}>Tipo MEI</FieldLabel>
              <Select id={fieldIds.tipoMei} value={form.tipoMei} onChange={event => setValue('tipoMei', event.target.value)}>
                <option value="geral">MEI geral</option>
                <option value="caminhoneiro">MEI caminhoneiro</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor={fieldIds.uf}>UF</FieldLabel>
              <Select id={fieldIds.uf} value={form.uf} onChange={event => setValue('uf', event.target.value)}>
                {BRAZIL_UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor={fieldIds.municipio}>Município</FieldLabel>
            <Input id={fieldIds.municipio} value={form.municipio} onChange={event => setValue('municipio', event.target.value)} placeholder="Cidade onde atua" required />
          </div>
        </div>
      ),
    },
    {
      title: 'Números do ano',
      text: 'Esses dados alimentam o radar de teto, Fator R e regime tributário.',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="onboarding-duo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel htmlFor={fieldIds.faturamentoAcumuladoAtual}>Faturamento acumulado</FieldLabel>
              <Input id={fieldIds.faturamentoAcumuladoAtual} inputMode="decimal" value={form.faturamentoAcumuladoAtual} onChange={event => setValue('faturamentoAcumuladoAtual', event.target.value)} placeholder="54000" required />
            </div>
            <div>
              <FieldLabel htmlFor={fieldIds.mesAtual}>Mês atual</FieldLabel>
              <Select id={fieldIds.mesAtual} value={form.mesAtual} onChange={event => setValue('mesAtual', event.target.value)}>
                {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="onboarding-duo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel htmlFor={fieldIds.faturamentoMensalEstimado}>Faturamento mensal médio</FieldLabel>
              <Input id={fieldIds.faturamentoMensalEstimado} inputMode="decimal" value={form.faturamentoMensalEstimado} onChange={event => setValue('faturamentoMensalEstimado', event.target.value)} placeholder="12000" required />
            </div>
            <div>
              <FieldLabel htmlFor={fieldIds.folhaMensal}>Folha/pró-labore mensal</FieldLabel>
              <Input id={fieldIds.folhaMensal} inputMode="decimal" value={form.folhaMensal} onChange={event => setValue('folhaMensal', event.target.value)} placeholder="0" required />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Objetivo do sistema',
      text: 'Define a prioridade dos cards e relatórios que o usuário verá primeiro.',
      body: (
        <div style={{ display: 'grid', gap: 10 }}>
          {ONBOARDING_OBJECTIVES.map(objetivo => {
            const selected = form.objetivoPrincipal === objetivo
            return (
              <button
                key={objetivo}
                type="button"
                onClick={() => setValue('objetivoPrincipal', objetivo)}
                aria-pressed={selected}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '13px 14px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${selected ? 'var(--lime)' : 'var(--border2)'}`,
                  background: selected ? 'rgba(200,241,53,0.08)' : 'var(--bg2)',
                  color: selected ? 'var(--text1)' : 'var(--text2)',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {objetivo}
              </button>
            )
          })}
        </div>
      ),
    },
  ]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 260px',
        gap: 20,
        alignItems: 'start',
      }} className="onboarding-shell">
        <div style={{ display: 'grid', gap: 14 }}>
          {cards.map((card, index) => {
            const isActive = active === index
            const isDone = cardStatus[index]
            const buttonId = `${idBase}-card-button-${index}`
            const panelId = `${idBase}-card-panel-${index}`
            return (
              <section
                key={card.title}
                style={{
                  position: 'relative',
                  background: isActive ? 'var(--bg1)' : 'var(--bg2)',
                  border: `1px solid ${isActive ? 'var(--lime)' : isDone ? 'rgba(200,241,53,0.35)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: isActive ? 24 : 18,
                  transform: isActive ? 'translateX(0) scale(1)' : isDone ? 'translateX(18px) scale(0.985)' : 'translateX(-8px) scale(0.985)',
                  opacity: isActive ? 1 : 0.72,
                  zIndex: isActive ? 12 : 1,
                  transition: 'all .26s ease',
                }}
              >
                <button
                  ref={element => {
                    headerRefs.current[index] = element
                  }}
                  id={buttonId}
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  onClick={() => setActive(index)}
                  onKeyDown={event => handleCardKeyDown(event, index, cards.length)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    marginBottom: isActive ? 18 : 0,
                    textAlign: 'left',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ color: isDone ? 'var(--lime)' : 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                      {String(index + 1).padStart(2, '0')} / 04
                    </div>
                    <h2 style={{ fontSize: isActive ? 24 : 17, margin: 0, lineHeight: 1.08 }}>
                      {card.title}
                    </h2>
                    {isActive && (
                      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
                        {card.text}
                      </p>
                    )}
                  </div>
                  <div aria-hidden="true" style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: `1px solid ${isDone ? 'var(--lime)' : 'var(--border2)'}`,
                    color: isDone ? '#000' : 'var(--text3)',
                    background: isDone ? 'var(--lime)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}>
                    {isDone ? '✓' : index + 1}
                  </div>
                </button>

                {isActive && (
                  <div id={panelId} role="region" aria-labelledby={buttonId}>
                    {card.body}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <aside className="onboarding-sidebar" style={{
          position: 'sticky',
          top: 24,
          background: 'var(--bg1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
        }}>
          <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
            Pré-cadastro
          </div>
          <div style={{ fontFamily: 'var(--mono)', color: 'var(--lime)', fontSize: 38, fontWeight: 900, lineHeight: 1 }}>
            {completion}/4
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            {email}<br />
            O dashboard é liberado quando os quatro blocos estiverem completos.
          </p>
          <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
            {cards.map((card, index) => (
              <button
                key={card.title}
                type="button"
                onClick={() => setActive(index)}
                aria-current={active === index ? 'step' : undefined}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 0',
                  color: active === index ? 'var(--text1)' : 'var(--text2)',
                  fontSize: 13,
                  fontWeight: 700,
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                <span>{card.title}</span>
                <span style={{ color: cardStatus[index] ? 'var(--lime)' : 'var(--text3)' }}>
                  {cardStatus[index] ? 'ok' : 'pendente'}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              marginTop: 18,
              padding: '11px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(255,74,74,0.25)',
              background: 'rgba(255,74,74,0.08)',
              color: 'var(--red)',
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!complete || state === 'saving'}
            style={{
              width: '100%',
              marginTop: 18,
              minHeight: 44,
              borderRadius: 'var(--radius)',
              background: complete ? 'var(--lime)' : 'var(--bg3)',
              color: complete ? '#000' : 'var(--text3)',
              fontSize: 14,
              fontWeight: 900,
              cursor: complete ? 'pointer' : 'not-allowed',
              opacity: state === 'saving' ? 0.7 : 1,
            }}
          >
            {state === 'saving' ? 'Preparando dashboard...' : 'Liberar dashboard'}
          </button>
        </aside>
      </div>
    </form>
  )
}
