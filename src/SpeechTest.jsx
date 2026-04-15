import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const TARGET_SAMPLE_RATE = 16000
const MAX_RECORDING_MS = 5000
const ASR_ENDPOINT = '/api/asr'

const normalize = (text) => text.toLowerCase().replace(/[^a-z]/g, '')

const levenshtein = (a, b) => {
  const s = normalize(a)
  const t = normalize(b)
  const m = s.length
  const n = t.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[m][n]
}

const scorePronunciation = (target, heard, confidence = 0.5) => {
  const distance = levenshtein(target, heard)
  const maxLen = Math.max(normalize(target).length, normalize(heard).length, 1)
  const similarity = 1 - distance / maxLen
  const baseScore = Math.max(0, Math.min(1, similarity))
  return Math.round((baseScore * 0.7 + confidence * 0.3) * 100)
}

const mergeAudioChunks = (chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Float32Array(totalLength)
  let offset = 0

  chunks.forEach((chunk) => {
    merged.set(chunk, offset)
    offset += chunk.length
  })

  return merged
}

const downsampleAudio = (input, inputSampleRate, outputSampleRate) => {
  if (inputSampleRate <= outputSampleRate) return input

  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.round(input.length / ratio)
  const output = new Float32Array(outputLength)

  let outputIndex = 0
  let inputIndex = 0

  while (outputIndex < outputLength) {
    const nextInputIndex = Math.round((outputIndex + 1) * ratio)
    let total = 0
    let count = 0

    for (let i = inputIndex; i < nextInputIndex && i < input.length; i += 1) {
      total += input[i]
      count += 1
    }

    output[outputIndex] = count > 0 ? total / count : 0
    outputIndex += 1
    inputIndex = nextInputIndex
  }

  return output
}

const writeWavString = (view, offset, value) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

const encodeWav = (samples, sampleRate) => {
  const wavBuffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(wavBuffer)

  writeWavString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeWavString(view, 8, 'WAVE')
  writeWavString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeWavString(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  samples.forEach((sample) => {
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
    offset += 2
  })

  return wavBuffer
}

const getAudioContextClass = () => window.AudioContext || window.webkitAudioContext

const getFriendlyErrorMessage = (error) => {
  if (!error) return '录音失败，请重试。'
  if (error.name === 'NotAllowedError') return '请先允许麦克风权限后再试。'
  if (error.name === 'NotFoundError') return '未检测到可用的麦克风设备。'
  if (error.name === 'NotReadableError') return '麦克风正被其他应用占用，请稍后再试。'
  if (error.message) return error.message
  return '录音失败，请重试。'
}

const parseAsrError = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({}))
    return payload.message || `云端识别失败（HTTP ${response.status}）。`
  }

  const text = (await response.text().catch(() => '')).trim()
  if (text) {
    return `云端识别失败（HTTP ${response.status}）：${text.slice(0, 160)}`
  }

  if (response.status === 404) {
    return '未找到 /api/asr 接口，请确认 EdgeOne Pages 已从 node-functions 目录部署函数。'
  }

  return `云端识别失败（HTTP ${response.status}），请检查函数部署和环境变量配置。`
}

function SpeechTest() {
  const location = useLocation()
  const navigate = useNavigate()
  const words = useMemo(() => {
    const list = location.state?.words || []
    return Array.from(new Set(list.filter(Boolean)))
  }, [location.state])
  const deckName = location.state?.deckName || '当前类别'

  const [index, setIndex] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(null)
  const [status, setStatus] = useState('idle') // idle | preparing | listening | processing | done | error
  const [error, setError] = useState('')
  const audioContextRef = useRef(null)
  const streamRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const processorRef = useRef(null)
  const audioChunksRef = useRef([])
  const inputSampleRateRef = useRef(TARGET_SAMPLE_RATE)
  const isRecordingRef = useRef(false)
  const stopTimerRef = useRef(null)
  const attemptRef = useRef(0)
  const targetWordRef = useRef('')

  const currentWord = words[index] || ''

  const cleanupRecording = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null
      processorRef.current.disconnect()
      processorRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current
      audioContextRef.current = null
      void context.close().catch(() => {})
    }

    isRecordingRef.current = false
  }

  const finishRecording = async (attemptId, targetWord) => {
    if (!isRecordingRef.current || attemptId !== attemptRef.current) return

    isRecordingRef.current = false
    setStatus('processing')

    const mergedAudio = mergeAudioChunks(audioChunksRef.current)
    audioChunksRef.current = []
    cleanupRecording()

    if (!mergedAudio.length) {
      if (attemptId !== attemptRef.current) return
      setStatus('error')
      setError('没有录到声音，请靠近麦克风后重试。')
      return
    }

    try {
      const outputSampleRate = inputSampleRateRef.current >= TARGET_SAMPLE_RATE
        ? TARGET_SAMPLE_RATE
        : inputSampleRateRef.current
      const pcmData = downsampleAudio(mergedAudio, inputSampleRateRef.current, outputSampleRate)
      const wavBuffer = encodeWav(pcmData, outputSampleRate)

      const response = await fetch(ASR_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav',
        },
        body: wavBuffer,
      })

      if (!response.ok) {
        throw new Error(await parseAsrError(response))
      }

      const payload = await response.json().catch(() => ({}))

      if (attemptId !== attemptRef.current) return

      const nextTranscript = (payload.transcript || '').trim()
      setTranscript(nextTranscript)
      setScore(nextTranscript ? scorePronunciation(targetWord, nextTranscript) : 0)
      setStatus('done')
    } catch (err) {
      if (attemptId !== attemptRef.current) return
      setStatus('error')
      if (window.location.protocol === 'file:') {
        setError('当前桌面版没有云端 ASR 接口，请在 EdgeOne Pages 部署环境中使用朗读测试。')
        return
      }
      setError(getFriendlyErrorMessage(err))
    }
  }

  useEffect(() => {
    attemptRef.current += 1
    targetWordRef.current = ''
    cleanupRecording()
    audioChunksRef.current = []
    setTranscript('')
    setScore(null)
    setStatus('idle')
    setError('')
  }, [index])

  useEffect(() => () => {
    attemptRef.current += 1
    cleanupRecording()
  }, [])

  const handleStart = async () => {
    if (!currentWord) return

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('当前浏览器不支持麦克风录音，请使用较新的 Chrome、Edge 或 Safari。')
      return
    }

    const AudioContextClass = getAudioContextClass()
    if (!AudioContextClass) {
      setStatus('error')
      setError('当前浏览器不支持音频采集，请更换浏览器后重试。')
      return
    }

    cleanupRecording()
    audioChunksRef.current = []

    const attemptId = attemptRef.current + 1
    attemptRef.current = attemptId
    targetWordRef.current = currentWord

    setError('')
    setTranscript('')
    setScore(null)

    try {
      setStatus('preparing')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const audioContext = new AudioContextClass()
      await audioContext.resume()

      const sourceNode = audioContext.createMediaStreamSource(stream)
      const processorNode = audioContext.createScriptProcessor(4096, 1, 1)

      inputSampleRateRef.current = audioContext.sampleRate
      streamRef.current = stream
      audioContextRef.current = audioContext
      sourceNodeRef.current = sourceNode
      processorRef.current = processorNode
      isRecordingRef.current = true

      processorNode.onaudioprocess = (event) => {
        if (!isRecordingRef.current) return
        const channelData = event.inputBuffer.getChannelData(0)
        audioChunksRef.current.push(new Float32Array(channelData))
      }

      sourceNode.connect(processorNode)
      processorNode.connect(audioContext.destination)

      stopTimerRef.current = window.setTimeout(() => {
        void finishRecording(attemptId, currentWord)
      }, MAX_RECORDING_MS)

      setStatus('listening')
    } catch (err) {
      cleanupRecording()
      setStatus('error')
      setError(getFriendlyErrorMessage(err))
    }
  }

  const handleStop = () => {
    if (status !== 'listening') return
    void finishRecording(attemptRef.current, targetWordRef.current)
  }

  const handleNext = () => {
    if (words.length === 0) return
    attemptRef.current += 1
    cleanupRecording()
    setIndex((prev) => (prev + 1) % words.length)
  }

  if (!words.length) {
    return (
      <div className="quiz-container">
        <div className="top-nav">
          <Link className="nav-link" to="/">主页</Link>
          <Link className="nav-link" to="/play">拼故事</Link>
          <Link className="nav-link" to="/words">单词卡片</Link>
        </div>
        <h2>朗读测试</h2>
        <div className="empty-state">未找到可用的单词，请返回单词卡片选择类别后再试。</div>
        <button className="simple-button" onClick={() => navigate('/words')}>回到单词卡片</button>
      </div>
    )
  }

  return (
    <div className="quiz-container">
      <div className="top-nav">
        <Link className="nav-link" to="/">主页</Link>
        <Link className="nav-link" to="/play">拼故事</Link>
        <Link className="nav-link" to="/words">单词卡片</Link>
        <Link className="nav-link" to="/sentence-quiz">句子挖空</Link>
      </div>
      <h1>朗读测试</h1>
      <p className="helper-text">当前词源：{deckName} | 共 {words.length} 词</p>

      <div className="flash-card" style={{cursor:'default', maxWidth: 420}}>
        <div className="flash-face front" style={{transform:'none', position:'relative'}}>
          <div className="flash-emoji">🎤</div>
          <div className="flash-word" style={{fontSize: '2.5rem'}}>{currentWord}</div>
          <div className="flash-hint">点击“开始录音”并朗读这个单词，系统会在 5 秒后自动停止</div>
        </div>
      </div>

      <div className="quiz-controls" style={{flexWrap:'wrap', gap: 8}}>
        <button onClick={handleStart} disabled={!currentWord || status === 'listening' || status === 'preparing' || status === 'processing'}>开始录音</button>
        <button onClick={handleStop} disabled={status !== 'listening'}>停止录音</button>
        <button onClick={handleNext}>换下一个</button>
        <button onClick={() => navigate('/words')}>返回单词卡片</button>
      </div>

      <div style={{marginTop: 16, textAlign:'center'}}>
        {status === 'preparing' && <div className="note">正在打开麦克风，请允许录音权限...</div>}
        {status === 'listening' && <div className="note">正在聆听，请朗读...</div>}
        {status === 'processing' && <div className="note">正在上传录音并识别，请稍候...</div>}
        {error && <div className="note warning">{error}</div>}
        {status === 'done' && (
          <div className="note" style={{maxWidth: 520, margin:'12px auto'}}>
            <div style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: 6}}>识别结果：{transcript || '（无）'}</div>
            <div style={{fontSize: '1.8rem', color: score >= 85 ? '#2e7d32' : score >= 60 ? '#f9a825' : '#c62828'}}>
              评分：{score ?? '--'} / 100
            </div>
            <div className="helper-text" style={{marginTop: 6}}>提示：环境要安静，尽量清晰、完整地读出单词。</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SpeechTest
