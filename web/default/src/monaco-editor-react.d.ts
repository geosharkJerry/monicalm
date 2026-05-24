declare module '@monaco-editor/react' {
  import type { ComponentType } from 'react'

  export type MonacoEditorProps = {
    language?: string
    theme?: string
    value?: string
    onChange?: (value: string | undefined) => void
    options?: Record<string, unknown>
  }

  const Editor: ComponentType<MonacoEditorProps>

  export default Editor
}
