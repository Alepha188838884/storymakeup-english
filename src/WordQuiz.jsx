import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './App.css'
import { UNIT_LIST } from './vocabUnits'

const shuffle = (arr) => {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const exampleTemplates = [
  'I see a {word}.',
  'Look at the {word}.',
  'This is my {word}.',
  'We like the {word}.',
  '{word} is here.',
  'I use the {word}.',
  'Please bring the {word}.',
]

const buildDeck = (source, size) => {
  const deck = []
  for (let i = 0; i < size; i++) {
    const base = source[i % source.length]
    const tpl = exampleTemplates[i % exampleTemplates.length]
    deck.push({
      word: base.word,
      translation: base.translation,
      emoji: base.emoji || '🃏',
      example: base.example || tpl.replace('{word}', base.word),
    })
  }
  return deck
}

const EASY_BASE = [
  { word: 'sun', translation: '太阳', emoji: '☀️' },
  { word: 'rain', translation: '雨', emoji: '🌧️' },
  { word: 'cloud', translation: '云', emoji: '☁️' },
  { word: 'star', translation: '星星', emoji: '🌟' },
  { word: 'ball', translation: '球', emoji: '⚽' },
  { word: 'book', translation: '书', emoji: '📖' },
  { word: 'dog', translation: '狗', emoji: '🐶' },
  { word: 'cat', translation: '猫', emoji: '🐱' },
  { word: 'bird', translation: '小鸟', emoji: '🐦' },
  { word: 'fish', translation: '鱼', emoji: '🐟' },
  { word: 'milk', translation: '牛奶', emoji: '🥛' },
  { word: 'water', translation: '水', emoji: '💧' },
  { word: 'bread', translation: '面包', emoji: '🍞' },
  { word: 'apple', translation: '苹果', emoji: '🍎' },
  { word: 'banana', translation: '香蕉', emoji: '🍌' },
  { word: 'rice', translation: '米饭', emoji: '🍚' },
  { word: 'egg', translation: '鸡蛋', emoji: '🥚' },
  { word: 'hat', translation: '帽子', emoji: '🎩' },
  { word: 'cup', translation: '杯子', emoji: '🥤' },
  { word: 'car', translation: '汽车', emoji: '🚗' },
  { word: 'bus', translation: '公交车', emoji: '🚌' },
  { word: 'bike', translation: '自行车', emoji: '🚲' },
  { word: 'park', translation: '公园', emoji: '🏞️' },
  { word: 'home', translation: '家', emoji: '🏠' },
  { word: 'bed', translation: '床', emoji: '🛏️' },
  { word: 'room', translation: '房间', emoji: '🛋️' },
  { word: 'school', translation: '学校', emoji: '🏫' },
  { word: 'bag', translation: '书包', emoji: '🎒' },
  { word: 'toy', translation: '玩具', emoji: '🧸' },
  { word: 'kite', translation: '风筝', emoji: '🪁' },
  { word: 'doll', translation: '娃娃', emoji: '🪆' },
  { word: 'block', translation: '积木', emoji: '🧱' },
  { word: 'train', translation: '火车', emoji: '🚂' },
]

const MEDIUM_BASE = [
  { word: 'teacher', translation: '老师', emoji: '👩‍🏫' },
  { word: 'student', translation: '学生', emoji: '🧒' },
  { word: 'friend', translation: '朋友', emoji: '🤝' },
  { word: 'garden', translation: '花园', emoji: '🌱' },
  { word: 'seed', translation: '种子', emoji: '🌰' },
  { word: 'flower', translation: '花', emoji: '🌸' },
  { word: 'tree', translation: '树', emoji: '🌳' },
  { word: 'leaf', translation: '叶子', emoji: '🍃' },
  { word: 'river', translation: '河流', emoji: '🌊' },
  { word: 'hill', translation: '小山', emoji: '⛰️' },
  { word: 'farm', translation: '农场', emoji: '🚜' },
  { word: 'farmer', translation: '农夫', emoji: '👨‍🌾' },
  { word: 'sheep', translation: '羊', emoji: '🐑' },
  { word: 'cow', translation: '奶牛', emoji: '🐮' },
  { word: 'horse', translation: '马', emoji: '🐴' },
  { word: 'chicken', translation: '小鸡', emoji: '🐤' },
  { word: 'station', translation: '车站', emoji: '🚉' },
  { word: 'bridge', translation: '桥', emoji: '🌉' },
  { word: 'street', translation: '街道', emoji: '🛣️' },
  { word: 'pencil', translation: '铅笔', emoji: '✏️' },
  { word: 'ruler', translation: '尺子', emoji: '📏' },
  { word: 'paper', translation: '纸', emoji: '📄' },
  { word: 'picture', translation: '图片', emoji: '🖼️' },
  { word: 'music', translation: '音乐', emoji: '🎵' },
  { word: 'song', translation: '歌曲', emoji: '🎶' },
  { word: 'drum', translation: '鼓', emoji: '🥁' },
  { word: 'dance', translation: '跳舞', emoji: '💃' },
  { word: 'jump', translation: '跳', emoji: '🤸' },
  { word: 'climb', translation: '爬', emoji: '🧗' },
  { word: 'clean', translation: '打扫', emoji: '🧹' },
  { word: 'sweep', translation: '扫地', emoji: '🧹' },
  { word: 'mop', translation: '拖地', emoji: '🧼' },
  { word: 'tidy', translation: '整理', emoji: '🧺' },
  { word: 'fold', translation: '折叠', emoji: '🧺' },
  { word: 'cook', translation: '做饭', emoji: '👩‍🍳' },
  { word: 'bake', translation: '烤', emoji: '🧁' },
  { word: 'carry', translation: '搬运', emoji: '📦' },
]

const HARD_BASE = [
  { word: 'hospital', translation: '医院', emoji: '🏥' },
  { word: 'doctor', translation: '医生', emoji: '👨‍⚕️' },
  { word: 'nurse', translation: '护士', emoji: '👩‍⚕️' },
  { word: 'visit', translation: '探访', emoji: '🤗' },
  { word: 'travel', translation: '旅行', emoji: '✈️' },
  { word: 'suitcase', translation: '行李箱', emoji: '🧳' },
  { word: 'airplane', translation: '飞机', emoji: '🛩️' },
  { word: 'airport', translation: '机场', emoji: '🛫' },
  { word: 'ticket', translation: '票', emoji: '🎟️' },
  { word: 'beach', translation: '海滩', emoji: '🏖️' },
  { word: 'shell', translation: '贝壳', emoji: '🐚' },
  { word: 'sand', translation: '沙子', emoji: '🏝️' },
  { word: 'wave', translation: '海浪', emoji: '🌊' },
  { word: 'mountain', translation: '山', emoji: '🏔️' },
  { word: 'camping', translation: '露营', emoji: '🏕️' },
  { word: 'tent', translation: '帐篷', emoji: '⛺' },
  { word: 'fire', translation: '篝火', emoji: '🔥' },
  { word: 'flashlight', translation: '手电筒', emoji: '🔦' },
  { word: 'night', translation: '夜晚', emoji: '🌙' },
  { word: 'dream', translation: '梦', emoji: '💭' },
  { word: 'planet', translation: '行星', emoji: '🪐' },
  { word: 'earth', translation: '地球', emoji: '🌍' },
  { word: 'moon', translation: '月亮', emoji: '🌙' },
  { word: 'space', translation: '太空', emoji: '🚀' },
  { word: 'morning', translation: '早晨', emoji: '🌅' },
  { word: 'evening', translation: '傍晚', emoji: '🌆' },
  { word: 'birthday', translation: '生日', emoji: '🎂' },
  { word: 'present', translation: '礼物', emoji: '🎁' },
  { word: 'market', translation: '市场', emoji: '🛒' },
  { word: 'store', translation: '商店', emoji: '🏬' },
  { word: 'coin', translation: '硬币', emoji: '🪙' },
  { word: 'slide', translation: '滑梯', emoji: '🛝' },
  { word: 'helmet', translation: '头盔', emoji: '🪖' },
  { word: 'safety', translation: '安全', emoji: '🛡️' },
  { word: 'strong', translation: '强壮', emoji: '💪' },
  { word: 'gentle', translation: '温和', emoji: '🤲' },
]

const WORD_DECKS = {
  '简单': buildDeck(EASY_BASE, 500),
  '中等': buildDeck(MEDIUM_BASE, 500),
  '困难': buildDeck(HARD_BASE, 500),
}

const UNIT_CATEGORY_OPTIONS = UNIT_LIST
  .slice()
  .sort((a, b) => (a.level === b.level ? a.unit - b.unit : a.level - b.level))
  .map(item => item.name)

const UNIT_CARD_DECKS = UNIT_LIST.reduce((acc, item) => {
  acc[item.name] = item.words.map((entry) => ({
    word: entry.english,
    translation: entry.chinese || '',
    emoji: '🃏',
    example: `I see ${entry.english}.`,
  }))
  return acc
}, {})

const speak = (text) => {
  if (!text) return
  const utter = new window.SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  window.speechSynthesis.speak(utter)
}

function WordQuiz() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState('简单')
  const [unitCategory, setUnitCategory] = useState('按难度')
  const [order, setOrder] = useState(() => shuffle(WORD_DECKS['简单'].map((_, idx) => idx)))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [notebook, setNotebook] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = window.localStorage.getItem('wordNotebookEnglish')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [viewNotebook, setViewNotebook] = useState(false)

  const difficultyDeck = useMemo(() => WORD_DECKS[difficulty], [difficulty])
  const activeDeck = useMemo(() => {
    if (viewNotebook) return notebook
    if (unitCategory !== '按难度') return UNIT_CARD_DECKS[unitCategory] || []
    return difficultyDeck
  }, [difficultyDeck, viewNotebook, notebook, unitCategory])
  const current = useMemo(() => activeDeck[order[index] || 0], [activeDeck, index, order])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wordNotebookEnglish', JSON.stringify(notebook))
    }
  }, [notebook])

  useEffect(() => {
    if (activeDeck.length === 0) {
      setOrder([])
      setIndex(0)
      setFlipped(false)
      return
    }
    setOrder(shuffle(activeDeck.map((_, idx) => idx)))
    setIndex(0)
    setFlipped(false)
  }, [activeDeck])

  const handleUnitCategoryChange = (e) => {
    setUnitCategory(e.target.value)
    setViewNotebook(false)
  }

  const handleNext = () => {
    if (order.length === 0) return
    setIndex((prev) => (prev + 1) % order.length)
    setFlipped(false)
  }

  const handlePrev = () => {
    if (order.length === 0) return
    setIndex((prev) => (prev - 1 + order.length) % order.length)
    setFlipped(false)
  }

  const handleShuffle = () => {
    setOrder(shuffle(activeDeck.map((_, idx) => idx)))
    setIndex(0)
    setFlipped(false)
  }

  const toggleNotebook = () => {
    if (!current) return
    const exists = notebook.some(item => item.word === current.word)
    if (exists) {
      setNotebook(notebook.filter(item => item.word !== current.word))
    } else {
      setNotebook([...notebook, current])
    }
  }

  const isInNotebook = current ? notebook.some(item => item.word === current.word) : false

  const handleFlip = () => setFlipped((v) => !v)

  const handleGoToSpeechTest = () => {
    if (activeDeck.length === 0) return
    const words = activeDeck.map(item => item.word).filter(Boolean)
    navigate('/speech', {
      state: {
        deckName: viewNotebook ? '生词本' : (unitCategory === '按难度' ? `按难度：${difficulty}` : unitCategory),
        words,
      },
    })
  }

  const handleGoToWordTest = () => {
    if (activeDeck.length === 0) return
    navigate('/test', {
      state: {
        deckName: viewNotebook ? '生词本' : (unitCategory === '按难度' ? `按难度：${difficulty}` : unitCategory),
        cards: activeDeck.map(item => ({ word: item.word, translation: item.translation })),
      },
    })
  }

  return (
    <div className="quiz-container">
      <div className="top-nav">
        <Link className="nav-link" to="/">主页</Link>
        <Link className="nav-link" to="/play">拼故事</Link>
        <Link className="nav-link" to="/sentence-quiz">句子挖空</Link>
      </div>
      <h1>单词卡片</h1>
      <p className="helper-text">
        点击卡片翻面，支持发音和示例。当前模式：{viewNotebook ? '生词本' : (unitCategory === '按难度' ? `按难度：${difficulty}` : unitCategory)} | 进度：{activeDeck.length === 0 ? 0 : index + 1} / {activeDeck.length}
      </p>

      <div className="category-row" style={{justifyContent:'center', marginBottom: 10}}>
        <label style={{fontWeight: 600}}>选择单词：</label>
        <select
          value={unitCategory}
          onChange={handleUnitCategoryChange}
          className="custom-select"
          disabled={viewNotebook}
        >
          <option value="按难度">按难度（内置三档）</option>
          {UNIT_CATEGORY_OPTIONS.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <label style={{fontWeight: 600}}>难度：</label>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="custom-select"
          disabled={viewNotebook || unitCategory !== '按难度'}
        >
          {Object.keys(WORD_DECKS).map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <button className="simple-button" onClick={() => setViewNotebook(false)} disabled={!viewNotebook}>全部卡片</button>
        <button className="simple-button primary" onClick={() => setViewNotebook(true)} disabled={viewNotebook || notebook.length === 0}>
          生词本（{notebook.length}）
        </button>
        <button className="simple-button" onClick={handleShuffle}>打乱顺序</button>
        <button className="simple-button" onClick={handleGoToSpeechTest} disabled={activeDeck.length === 0}>朗读测试</button>
        <button className="simple-button" onClick={handleGoToWordTest} disabled={activeDeck.length === 0}>单词测试</button>
      </div>

      {activeDeck.length === 0 ? (
        <div className="empty-state" style={{maxWidth: 520}}>
          {viewNotebook ? '生词本还空空的，先在卡片上点击“加入生词本”吧。' : '当前没有卡片可显示。'}
        </div>
      ) : (
        <>
          <div className={'flash-card' + (flipped ? ' flipped' : '')} onClick={handleFlip}>
            <div className="flash-face front">
              <div className="flash-emoji"></div>
              <div className="flash-word">{current?.word}</div>
              <div className="flash-hint">点击翻转查看中文</div>
            </div>
            <div className="flash-face back">
              <div className="flash-word">{current?.translation}</div>
              <div className="flash-hint">再点一次翻回正面</div>
            </div>
          </div>

          <div className="quiz-controls">
            <button onClick={handlePrev}>上一张</button>
            <button onClick={handleFlip}>翻转</button>
            <button onClick={() => speak(current?.word)}>读单词</button>
            <button onClick={toggleNotebook}>{isInNotebook ? '移出生词本' : '加入生词本'}</button>
            <button onClick={handleNext}>下一张</button>
          </div>
        </>
      )}

    </div>
  )
}

export default WordQuiz
