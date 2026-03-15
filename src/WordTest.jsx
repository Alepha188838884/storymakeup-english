import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const normalizeEn = (text) => text.toLowerCase().replace(/[^a-z]/g, '')
const normalizeZh = (text) => text.replace(/[\s,，。！？!？、；;·]/g, '')

const levenshtein = (a, b) => {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

const similarZh = (a, b) => {
  const s = normalizeZh(a)
  const t = normalizeZh(b)
  if (!s || !t) return 0
  if (s.includes(t) || t.includes(s)) return 1
  const dist = levenshtein(s, t)
  const maxLen = Math.max(s.length, t.length, 1)
  return 1 - dist / maxLen
}

const isCorrectCnToEn = (answer, target) => {
  const normA = normalizeEn(answer)
  const normT = normalizeEn(target)
  if (!normA || !normT) return false
  if (normA === normT) return true
  const dist = levenshtein(normA, normT)
  const ratio = 1 - dist / Math.max(normA.length, normT.length, 1)
  return ratio >= 0.8
}

const isCorrectEnToZh = (answer, targetZh) => {
  if (!answer || !targetZh) return false
  const sim = similarZh(answer, targetZh)
  const maxLen = Math.max(normalizeZh(answer).length, normalizeZh(targetZh).length, 1)
  const threshold = maxLen <= 3 ? 0.5 : 0.65
  return sim >= threshold
}

function WordTest() {
  const location = useLocation()
  const navigate = useNavigate()
  const cards = useMemo(() => location.state?.cards || [], [location.state])
  const deckName = location.state?.deckName || '当前类别'

  const [mode, setMode] = useState('cn2en') // cn2en | en2zh
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState(null) // null | correct | wrong
  const [wrongCount, setWrongCount] = useState(0)
  const [lastAttempt, setLastAttempt] = useState(null) // { answer, correct }

  const current = cards[index] || null

  const handleSubmit = () => {
    if (!current) return
    const answer = input.trim()
    const correct = mode === 'cn2en'
      ? isCorrectCnToEn(answer, current.word)
      : isCorrectEnToZh(answer, current.translation)
    if (correct) {
      setStatus('correct')
      setFeedback('✅ 回答正确！')
      setWrongCount(0)
    } else {
      setStatus('wrong')
      setWrongCount(prev => prev + 1)
      setFeedback('❌ 再试试～')
    }
    setLastAttempt({ answer, correct })
  }

  const handleNext = () => {
    if (!cards.length) return
    setIndex((prev) => (prev + 1) % cards.length)
    setInput('')
    setFeedback('')
    setStatus(null)
    setWrongCount(0)
    setLastAttempt(null)
  }

  const handleUndo = () => {
    if (!lastAttempt) return
    if (!lastAttempt.correct) {
      setWrongCount(prev => Math.max(0, prev - 1))
    }
    setFeedback('')
    setStatus(null)
    setInput(lastAttempt.answer || '')
    setLastAttempt(null)
  }

  if (!cards.length) {
    return (
      <div className="quiz-container">
        <div className="top-nav">
          <Link className="nav-link" to="/">主页</Link>
          <Link className="nav-link" to="/play">拼故事</Link>
          <Link className="nav-link" to="/words">单词卡片</Link>
        </div>
        <h2>单词测试</h2>
        <div className="empty-state">未找到可用的单词，请回到单词卡片选择类别后再试。</div>
        <button className="simple-button" onClick={() => navigate('/words')}>回到单词卡片</button>
      </div>
    )
  }

  const prompt = mode === 'cn2en' ? (current.translation || '') : (current.word || '')
  const answerDisplay = mode === 'cn2en'
    ? `${current.word} (${current.translation})`
    : `${current.translation} (${current.word})`

  return (
    <div className="quiz-container">
      <div className="top-nav">
        <Link className="nav-link" to="/">主页</Link>
        <Link className="nav-link" to="/play">拼故事</Link>
        <Link className="nav-link" to="/words">单词卡片</Link>
        <Link className="nav-link" to="/sentence-quiz">句子挖空</Link>
      </div>
      <h1>单词测试</h1>
      <p className="helper-text">当前词源：{deckName} | 共 {cards.length} 词</p>

      <div className="category-row" style={{justifyContent:'center', marginBottom: 16}}>
        <label style={{fontWeight:600}}>模式：</label>
        <select value={mode} onChange={e => { setMode(e.target.value); setFeedback(''); setStatus(null); setInput('') }} className="custom-select">
          <option value="cn2en">中译英</option>
          <option value="en2zh">英译中</option>
        </select>
        <button className="simple-button" onClick={handleNext}>换一个</button>
        <button className="simple-button" onClick={() => navigate('/words')}>返回卡片</button>
      </div>

      <div className="flash-card" style={{cursor:'default', maxWidth: 520}}>
        <div className="flash-face front" style={{transform:'none', position:'relative'}}>
          <div className="flash-emoji">{mode === 'cn2en' ? '🇨🇳 ➜ 🇬🇧' : '🇬🇧 ➜ 🇨🇳'}</div>
          <div className="flash-word" style={{fontSize: '2.2rem', lineHeight:'2.6rem'}}>{prompt}</div>
          <div className="flash-hint">{mode === 'cn2en' ? '请输入英文' : '请输入中文（可用近义词）'}</div>
        </div>
      </div>

      <div className="quiz-controls" style={{flexWrap:'wrap', gap: 8}}>
        <input
          className="custom-text-input"
          style={{minWidth: 240}}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder={mode === 'cn2en' ? '输入英文答案' : '输入中文答案'}
        />
        <button onClick={handleSubmit}>提交</button>
        <button onClick={handleUndo} disabled={!lastAttempt}>撤回</button>
        <button onClick={handleNext}>下一题</button>
      </div>

      {feedback && (
        <div className={`note ${status === 'wrong' ? 'warning' : ''}`} style={{marginTop: 12}}>
          <div style={{fontSize:'1.2rem', fontWeight:600}}>{feedback}</div>
          {wrongCount >= 3 || status === 'correct' ? (
            <div className="helper-text">正确答案：{answerDisplay}</div>
          ) : (
            <div className="helper-text">再试试，错满 3 次会显示答案（已错 {wrongCount} 次）</div>
          )}
        </div>
      )}
    </div>
  )
}

export default WordTest
