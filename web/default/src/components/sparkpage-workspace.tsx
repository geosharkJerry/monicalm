import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Loader2, PlayCircle, Sparkles, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type AgentType = 'DRAMA' | 'MUSIC' | 'AD' | 'GAME'

type StageKey = 'architecture' | 'assets' | 'review'
type StageStatus = 'waiting' | 'loading' | 'streaming' | 'done'

interface StageState {
  status: StageStatus
  content: string[]
  progress?: number
}

interface SsePayload {
  stage: string
  content?: string
  progress?: number
  status?: StageStatus
}

interface SparkpageWorkspaceProps {
  agentType: AgentType
  sseUrl?: string
}

const STAGE_ORDER: StageKey[] = ['architecture', 'assets', 'review']

const createInitialStages = (): Record<StageKey, StageState> => ({
  architecture: { status: 'waiting', content: [] },
  assets: { status: 'waiting', content: [] },
  review: { status: 'waiting', content: [] },
})

const stageTitleMap: Record<StageKey, string> = {
  architecture: 'AI Creative Architecture Breakdown',
  assets: 'Deep Digital Asset Generation',
  review: 'Training Quality Compliance Self-review',
}

const stageAliasMap: Record<string, StageKey> = {
  architecture: 'architecture',
  creative_architecture: 'architecture',
  assets: 'assets',
  digital_assets: 'assets',
  review: 'review',
  quality_review: 'review',
}

export function SparkpageWorkspace(props: SparkpageWorkspaceProps) {
  const { t } = useTranslation()
  const [concept, setConcept] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [stages, setStages] = useState<Record<StageKey, StageState>>(createInitialStages)
  const eventSourceRef = useRef<EventSource | null>(null)

  const agentTag = useMemo(() => `${props.agentType} Agent`, [props.agentType])

  const closeEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const patchStage = (stage: StageKey, updater: (prev: StageState) => StageState) => {
    setStages((prev) => ({
      ...prev,
      [stage]: updater(prev[stage]),
    }))
  }

  const markNextLoading = (stage: StageKey) => {
    const stageIndex = STAGE_ORDER.indexOf(stage)
    const nextStage = STAGE_ORDER[stageIndex + 1]
    if (!nextStage) {
      setIsRunning(false)
      closeEventSource()
      return
    }
    patchStage(nextStage, (prev) => ({ ...prev, status: 'loading' }))
  }

  const handleSsePayload = (payload: SsePayload) => {
    const mappedStage = stageAliasMap[payload.stage]
    if (!mappedStage) {
      return
    }

    patchStage(mappedStage, (prev) => {
      const nextStatus = payload.status ?? (payload.content ? 'streaming' : prev.status)
      const nextContent = payload.content ? [...prev.content, payload.content] : prev.content
      const nextProgress = payload.progress ?? prev.progress
      return { status: nextStatus, content: nextContent, progress: nextProgress }
    })

    if (payload.status === 'done') {
      markNextLoading(mappedStage)
    }
  }

  const startRun = () => {
    if (!concept.trim()) {
      return
    }

    closeEventSource()
    setStages(createInitialStages())
    setIsRunning(true)
    patchStage('architecture', (prev) => ({ ...prev, status: 'loading' }))

    if (!props.sseUrl) {
      return
    }

    const endpoint = new URL(props.sseUrl, window.location.origin)
    endpoint.searchParams.set('agentType', props.agentType)
    endpoint.searchParams.set('concept', concept)

    const source = new EventSource(endpoint.toString())
    eventSourceRef.current = source

    source.onmessage = (event) => {
      try {
        const parsed: SsePayload = JSON.parse(event.data)
        handleSsePayload(parsed)
      } catch {
        // ignore malformed chunk
      }
    }

    source.onerror = () => {
      setIsRunning(false)
      closeEventSource()
    }
  }

  useEffect(() => {
    return () => {
      closeEventSource()
    }
  }, [])

  return (
    <section className='min-h-screen bg-slate-950 p-6 text-slate-100'>
      <div className='mx-auto w-full max-w-6xl space-y-6'>
        <header className='rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_0_60px_-15px_rgba(99,102,241,0.45)]'>
          <div className='mb-4 flex items-center gap-2 text-indigo-300'>
            <Sparkles className='h-5 w-5' aria-hidden='true' />
            <p className='text-sm font-medium'>{agentTag}</p>
          </div>
          <div className='flex flex-col gap-3 md:flex-row'>
            <input
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder={t('Input your core creative concept...')}
              className='h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 outline-none ring-indigo-400 transition focus:ring-2'
              aria-label={t('Core creative concept input')}
            />
            <button
              type='button'
              onClick={startRun}
              disabled={isRunning || !concept.trim()}
              className='inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isRunning ? <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' /> : <PlayCircle className='h-4 w-4' aria-hidden='true' />}
              {t('Start fully automated AI production')}
            </button>
          </div>
        </header>

        <main className='grid gap-4 lg:grid-cols-3'>
          {STAGE_ORDER.map((stage) => (
            <article
              key={stage}
              className='rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm'
            >
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-indigo-200'>{t(stageTitleMap[stage])}</h3>
                {stages[stage].status === 'done' ? (
                  <CheckCircle2 className='h-5 w-5 text-emerald-400' aria-hidden='true' />
                ) : stages[stage].status === 'waiting' ? (
                  <Wand2 className='h-5 w-5 text-slate-500' aria-hidden='true' />
                ) : (
                  <Loader2 className='h-5 w-5 animate-spin text-indigo-300' aria-hidden='true' />
                )}
              </div>

              {stages[stage].status === 'loading' && (
                <div className='space-y-2'>
                  <div className='h-3 w-full animate-pulse rounded bg-slate-700' />
                  <div className='h-3 w-4/5 animate-pulse rounded bg-slate-700' />
                  <div className='h-3 w-3/5 animate-pulse rounded bg-slate-700' />
                </div>
              )}

              {stage === 'assets' && typeof stages[stage].progress === 'number' && stages[stage].status !== 'waiting' && (
                <div className='mb-3 h-2 w-full overflow-hidden rounded bg-slate-800'>
                  <div
                    className='h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all'
                    style={{ width: `${Math.max(0, Math.min(100, stages[stage].progress ?? 0))}%` }}
                  />
                </div>
              )}

              <div className='space-y-2 text-sm text-slate-300'>
                {stages[stage].content.length === 0 ? (
                  <p className='text-slate-500'>{t('Waiting for stream data...')}</p>
                ) : (
                  stages[stage].content.map((line, index) => (
                    <p key={`${stage}-${index}`} className='whitespace-pre-wrap'>
                      {line}
                    </p>
                  ))
                )}
              </div>
            </article>
          ))}
        </main>
      </div>
    </section>
  )
}
