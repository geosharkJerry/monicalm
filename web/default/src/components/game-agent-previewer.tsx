import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'

export type GameAgentPreviewerProps = {
  initialCode: string
  editable?: boolean
  className?: string
}

export function GameAgentPreviewer(props: GameAgentPreviewerProps) {
  const { t } = useTranslation()
  const blobUrlRef = useRef<string | null>(null)
  const [code, setCode] = useState(props.initialCode)
  const [iframeSrc, setIframeSrc] = useState<string>('about:blank')

  useEffect(() => {
    setCode(props.initialCode)
  }, [props.initialCode])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  const editorOptions = useMemo(() => {
    return {
      minimap: { enabled: false },
      fontSize: 13,
      readOnly: !props.editable,
      wordWrap: 'on' as const,
      automaticLayout: true,
    }
  }, [props.editable])

  const handleRunCode = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }
    const nextBlobUrl = URL.createObjectURL(new Blob([code], { type: 'text/html' }))
    blobUrlRef.current = nextBlobUrl
    setIframeSrc(nextBlobUrl)
  }

  return (
    <div className={props.className ?? 'h-full w-full'}>
      <div className="mb-3 flex items-center justify-end">
        <Button type="button" onClick={handleRunCode}>
          {t('Run code')}
        </Button>
      </div>

      <div className="grid h-[70vh] min-h-[420px] grid-cols-1 overflow-hidden rounded-lg border lg:grid-cols-2">
        <div className="h-full overflow-hidden border-b lg:border-r lg:border-b-0">
          <Editor
            theme="vs-dark"
            language="html"
            value={code}
            onChange={(value: string | undefined) => setCode(value ?? '')}
            options={editorOptions}
          />
        </div>

        <iframe
          title={t('Game agent preview')}
          src={iframeSrc}
          sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock"
          className="h-full w-full bg-background"
        />
      </div>
    </div>
  )
}

export default GameAgentPreviewer
