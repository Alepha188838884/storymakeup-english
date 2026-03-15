import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import { UNIT_LIST } from './vocabUnits'

const shuffle = (arr) => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const normalizeWord = (word) => word.toLowerCase().replace(/[^a-z']/g, '')

const shouldBlank = (word, wordSet) => {
  const norm = normalizeWord(word)
  if (!norm) return false
  if (wordSet.has(norm)) return true
  // Allow simple plural match by stripping a trailing s
  if (norm.endsWith('s') && wordSet.has(norm.slice(0, -1))) return true
  return false
}

const buildSentenceTokens = (sentence, wordSet) => {
  const parts = sentence.split(/\s+/)
  const tokens = []
  const blanks = []

  parts.forEach((part, idx) => {
    const match = part.match(/^([A-Za-z']+)([^A-Za-z']*)$/)
    const base = match ? match[1] : part
    const tail = match ? match[2] : ''
    const blank = shouldBlank(base, wordSet)
    const blankId = blank ? `${idx}-${base}` : null
    tokens.push({
      original: part,
      base,
      tail,
      isBlank: blank,
      blankId,
    })
    if (blank) {
      blanks.push({
        id: blankId,
        answer: base,
      })
    }
  })

  return { tokens, blanks }
}

function SentenceQuiz() {
  const unitsWithSentences = useMemo(
    () => UNIT_LIST.filter(u => u.sentences && u.sentences.length > 0),
    []
  )
  const [selectedUnitName, setSelectedUnitName] = useState(unitsWithSentences[0]?.name || '')
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [filled, setFilled] = useState({})
  const [bank, setBank] = useState([])
  const [feedback, setFeedback] = useState('')
  const [cnMeaning, setCnMeaning] = useState('')

  const currentUnit = unitsWithSentences.find(u => u.name === selectedUnitName) || null
  const currentSentence = currentUnit?.sentences?.[sentenceIdx] || ''
  const currentTranslation = currentUnit?.sentenceTranslations?.[sentenceIdx] || ''
  const wordSet = useMemo(() => new Set((currentUnit?.words || []).map(w => normalizeWord(w.english))), [currentUnit])
  const { tokens, blanks } = useMemo(() => buildSentenceTokens(currentSentence, wordSet), [currentSentence, wordSet])

  useEffect(() => {
    setSentenceIdx(0)
    setFilled({})
    setFeedback('')
    setCnMeaning('')
  }, [selectedUnitName])

  useEffect(() => {
    const shuffled = shuffle(blanks.map(b => b.answer))
    setBank(shuffled)
    setFilled({})
    setFeedback('')
    setCnMeaning('')
  }, [currentSentence])

  const getNextBlankId = () => blanks.find(b => !filled[b.id])?.id

  const handleSelectWord = (word) => {
    const blankId = getNextBlankId()
    if (!blankId) return
    setFeedback('')
    setFilled(prev => ({ ...prev, [blankId]: word }))
    setBank(prev => {
      const idx = prev.indexOf(word)
      if (idx === -1) return prev
      const clone = prev.slice()
      clone.splice(idx, 1)
      return clone
    })
  }

  const handleRemoveFromBlank = (blankId) => {
    const word = filled[blankId]
    if (!word) return
    setFeedback('')
    setFilled(prev => {
      const next = { ...prev }
      delete next[blankId]
      return next
    })
    setBank(prev => [word, ...prev])
  }

  const handleReset = () => {
    setFilled({})
    setBank(shuffle(blanks.map(b => b.answer)))
    setFeedback('')
    setCnMeaning('')
  }

  const handlePrevSentence = () => {
    if (!currentUnit) return
    const len = currentUnit.sentences.length
    const prevIdx = (sentenceIdx - 1 + len) % len
    setSentenceIdx(prevIdx)
  }

  const handleNextSentence = () => {
    if (!currentUnit) return
    const len = currentUnit.sentences.length
    const nextIdx = (sentenceIdx + 1) % len
    setSentenceIdx(nextIdx)
  }

  const handleCheck = () => {
    const allFilled = blanks.every(b => filled[b.id])
    if (!allFilled) {
      setFeedback('请先把所有挖空词填完～')
      return
    }
    const isCorrect = blanks.every(b => normalizeWord(filled[b.id]) === normalizeWord(b.answer))
    if (isCorrect) {
      setFeedback('✅ 正确！分数 +1')
      setCnMeaning(currentTranslation || '暂无中文译文')
      setScore(prev => prev + 1)
    } else {
      setFeedback('❌ 顺序不对，再试试！')
      setCnMeaning('')
    }
  }

  const renderToken = (token) => {
    if (!token.isBlank) {
      return (
        <span key={token.blankId || token.original} className="sentence-word" style={{marginRight: 6}}>
          {token.original}
        </span>
      )
    }
    const placed = filled[token.blankId] || ''
    return (
      <span
        key={token.blankId}
        onClick={() => handleRemoveFromBlank(token.blankId)}
        className="sentence-word"
        style={{
          minWidth: '80px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #1976d2',
          background: placed ? '#e3f2fd' : '#fafafa',
          color: placed ? '#0d47a1' : '#555',
          marginRight: 6,
          cursor: placed ? 'pointer' : 'default',
        }}
      >
        {placed || '____'}{token.tail}
      </span>
    )
  }

  if (!currentUnit) {
    return (
      <div className="quiz-container">
        <div className="top-nav">
          <Link className="nav-link" to="/">主页</Link>
          <Link className="nav-link" to="/play">拼故事</Link>
          <Link className="nav-link" to="/words">单词卡片</Link>
        </div>
        <div className="empty-state">当前没有可用的句子单元。</div>
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
      <h1>句子挖空练习</h1>
      <div style={{textAlign:'center', marginBottom: 8, fontWeight:'bold', color:'#e65100'}}>分数：{score}</div>
      <div className="category-row" style={{justifyContent:'center'}}>
        <label style={{fontWeight:600}}>单元：</label>
        <select
          value={selectedUnitName}
          onChange={e => setSelectedUnitName(e.target.value)}
          className="custom-select"
        >
          {unitsWithSentences.map(u => (
            <option key={u.name} value={u.name}>{u.name}</option>
          ))}
        </select>
        <span style={{marginLeft: 12}}>句子 {sentenceIdx + 1} / {currentUnit.sentences.length}</span>
        <button className="simple-button" style={{marginLeft: 12}} onClick={handlePrevSentence}>上一句</button>
        <button className="simple-button" style={{marginLeft: 8}} onClick={handleNextSentence}>下一句</button>
        <button className="simple-button" style={{marginLeft: 8}} onClick={handleReset}>重置</button>
      </div>

      <div className="sentence-bar" style={{flexWrap:'wrap', marginTop: 16, minHeight: 64}}>
        {tokens.map(renderToken)}
      </div>

      <div className="word-list" style={{marginTop: 16}}>
        {bank.map((word, idx) => (
          <div
            key={`${word}-${idx}`}
            className="word-card"
            onClick={() => handleSelectWord(word)}
            style={{cursor:'pointer'}}
          >
            {word}
          </div>
        ))}
      </div>

      <div className="actions" style={{marginTop: 12}}>
        <button onClick={handleCheck} disabled={blanks.length === 0}>检查</button>
      </div>
      {feedback && (
        <div className="note" style={{marginTop: 8, background: feedback.startsWith('✅') ? '#e8f5e9' : '#fff3e0', color: feedback.startsWith('✅') ? '#2e7d32' : '#ef6c00'}}>
          {feedback}
        </div>
      )}
      {cnMeaning && (
        <div
          className="note"
          style={{
            marginTop: 8,
            background: '#e8f5e9',
            color: '#2e7d32',
            fontSize: '1.4rem',
            lineHeight: 1.6,
          }}
        >
          中文：{cnMeaning}
        </div>
      )}
    </div>
  )
}

export default SentenceQuiz
