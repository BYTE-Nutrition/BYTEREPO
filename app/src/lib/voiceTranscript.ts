export type VoiceTranscriptRole = 'user' | 'assistant'

export type VoiceTranscriptMessage = {
  id: string
  role: VoiceTranscriptRole
  text: string
  createdAt: number
  status?: 'streaming' | 'final'
}
