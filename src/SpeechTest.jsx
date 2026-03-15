import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

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
  // Combine similarity with browser confidence (if provided) and scale to 0-100.
  return Math.round((baseScore * 0.7 + confidence * 0.3) * 100)
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
  const [status, setStatus] = useState('idle') // idle | listening | done | error
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const currentWord = words[index] || ''

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('当前浏览器不支持语音识别，请使用 Chrome 等支持 Web Speech API 的浏览器。')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setStatus('listening')
      setError('')
      setTranscript('')
      setScore(null)
    }

    recognition.onresult = (event) => {
      if (!currentWord) return
      const alternatives = Array.from(event.results?.[0] || [])
      if (alternatives.length === 0) {
        setTranscript('')
        setScore(null)
        setStatus('done')
        return
      }
      const scored = alternatives.map((alt) => {
        const heard = alt.transcript || ''
        const conf = typeof alt.confidence === 'number' ? alt.confidence : 0.5
        return { heard, conf, score: scorePronunciation(currentWord, heard, conf) }
      })
      const best = scored.reduce((bestAlt, cur) => (cur.score > bestAlt.score ? cur : bestAlt), scored[0])
      setTranscript(best.heard)
      setScore(best.score)
      setStatus('done')
    }

    recognition.onerror = (event) => {
      setStatus('error')
      setError(event.error || '语音识别出错，请重试')
    }

    recognition.onend = () => {
      setStatus((prev) => (prev === 'listening' ? 'done' : prev))
    }

    recognitionRef.current = recognition
    return () => {
      recognition.stop?.()
      recognitionRef.current = null
    }
  }, [currentWord])

  useEffect(() => {
    setTranscript('')
    setScore(null)
    setStatus('idle')
    setError('')
  }, [index])

  const handleStart = () => {
    if (!recognitionRef.current || !currentWord) return
    setError('')
    setTranscript('')
    setScore(null)
    recognitionRef.current.start()
  }

  const handleStop = () => {
    recognitionRef.current?.stop()
  }

  const handleNext = () => {
    if (words.length === 0) return
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
          <div className="flash-hint">点击“开始录音”并朗读这个单词</div>
        </div>
      </div>

      <div className="quiz-controls" style={{flexWrap:'wrap', gap: 8}}>
        <button onClick={handleStart} disabled={!currentWord || status === 'listening'}>开始录音</button>
        <button onClick={handleStop} disabled={status !== 'listening'}>停止录音</button>
        <button onClick={handleNext}>换下一个</button>
        <button onClick={() => navigate('/words')}>返回单词卡片</button>
      </div>

      <div style={{marginTop: 16, textAlign:'center'}}>
        {status === 'listening' && <div className="note">正在聆听，请朗读...</div>}
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
