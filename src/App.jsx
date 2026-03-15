import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import { getStoriesByDifficulty } from './stories'
import { UNIT_LIST } from './vocabUnits'

// 英文单词表情映射（全部小写匹配）
const WORD_EMOJIS = {
  'sun': '☀️',
  'mom': '👩',
  'dad': '👨',
  'dog': '🐶',
  'cat': '🐱',
  'bird': '🐦',
  'duck': '🦆',
  'cow': '🐮',
  'ball': '⚽',
  'kite': '🪁',
  'car': '🚗',
  'train': '🚂',
  'doll': '🧸',
  'park': '🏞️',
  'yard': '🏡',
  'garden': '🌱',
  'room': '🛋️',
  'book': '📖',
  'school': '🏫',
  'bus': '🚌',
  'farm': '🚜',
  'goat': '🐐',
  'milk': '🥛',
  'egg': '🥚',
  'eggs': '🥚',
  'seed': '🌱',
  'sprout': '🌿',
  'water': '💧',
  'umbrella': '☂️',
  'hat': '🎩',
  'star': '⭐',
  'stars': '🌟',
  'story': '📖',
  'light': '🔦',
  'table': '🪑',
  'cup': '🥤',
  'cups': '🥤',
  'rice': '🍚',
  'bread': '🍞',
  'noodles': '🍜',
  'soup': '🥣',
  'juice': '🧃',
  'apple': '🍎',
  'banana': '🍌',
  'pear': '🍐',
  'grape': '🍇',
  'peach': '🍑',
  'red': '🔴',
  'blue': '🔵',
  'green': '🟢',
  'yellow': '🟡',
  'pink': '🌸',
  'sunny': '☀️',
  'cloudy': '☁️',
  'rainy': '🌧️',
}

const getEmojiForWord = (word) => WORD_EMOJIS[word.toLowerCase()] || ''

const createEmptyRound = () => ({
  id: `${Date.now()}-${Math.random()}`,
  wordsInput: '',
  emoji: '',
})

const BUILT_IN_UNIT_CATEGORIES = UNIT_LIST
  .filter(item => item.sentences && item.sentences.length > 0)
  .reduce((acc, item) => {
    const rounds = item.sentences.map((sentence, idx) => {
      const cleaned = sentence.replace(/[.,!?，、]/g, '').trim()
      const words = cleaned.split(/\s+/).filter(Boolean)
      return {
        words,
        correctSentence: words.join(' '),
        emoji: '📖',
        translation: (item.sentenceTranslations || [])[idx] || '',
      }
    })
    acc[item.name] = [
      {
        id: `unit-${item.level}-${item.unit}`,
        title: item.name,
        theme: item.name,
        difficulty: '简单',
        rounds,
        fullStory: rounds.map(r => r.correctSentence).join(' '),
      },
    ]
    return acc
  }, {})

const BUILT_IN_UNIT_NAMES = UNIT_LIST
  .filter(item => item.sentences && item.sentences.length > 0)
  .sort((a, b) => (a.level === b.level ? a.unit - b.unit : a.level - b.level))
  .map(item => item.name)

const loadCustomCategories = () => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = window.localStorage.getItem('customCategoriesEnglish')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

const buildAllCategories = (custom) => ({ ...BUILT_IN_UNIT_CATEGORIES, ...custom })

const buildSentencePool = (difficulty, category, categoryMap) => {
  const stories = category === '系统类'
    ? getStoriesByDifficulty(difficulty)
    : (categoryMap[category] || []).filter(story => story.difficulty === difficulty)
  const flattened = []
  stories.forEach(story => {
    (story.rounds || []).forEach((round, idx) => {
      flattened.push({
        id: `${story.id || 's'}-${idx}`,
        title: story.title || category,
        words: round.words,
        correctSentence: round.correctSentence,
        translation: round.translation || '',
      })
    })
  })
  return flattened
}

const pickSentence = (pool, excludeIds = []) => {
  const available = pool.filter(item => !excludeIds.includes(item.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

// 洗牌算法
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function App() {
  const [customCategories, setCustomCategories] = useState(loadCustomCategories)
  const [category, setCategory] = useState('系统类')
  const [difficulty, setDifficulty] = useState('简单')
  const [score, setScore] = useState(0)
  const [usedSentenceIds, setUsedSentenceIds] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [storyForm, setStoryForm] = useState({
    title: '',
    difficulty: '简单',
    rounds: [createEmptyRound()],
  })
  const [managementNote, setManagementNote] = useState('')
  const [showManager, setShowManager] = useState(false)
  const [sentencePool, setSentencePool] = useState(() => buildSentencePool('简单', '系统类', buildAllCategories(loadCustomCategories())))
  const [currentSentence, setCurrentSentence] = useState(() => {
    const pool = buildSentencePool('简单', '系统类', buildAllCategories(loadCustomCategories()))
    return pickSentence(pool, [])
  })
  const [selectedWords, setSelectedWords] = useState([])

  const allCategories = useMemo(() => buildAllCategories(customCategories), [customCategories])
  const isBuiltInUnitCategory = Boolean(BUILT_IN_UNIT_CATEGORIES[category])
  const isUserCategory = category !== '系统类' && !isBuiltInUnitCategory
  const managedStories = isUserCategory ? customCategories[category] || [] : []
  const categoryStories = isBuiltInUnitCategory ? BUILT_IN_UNIT_CATEGORIES[category] || [] : managedStories

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('customCategoriesEnglish', JSON.stringify(customCategories))
    }
  }, [customCategories])

  const refreshStory = (nextStory) => {
    // deprecated
    setCurrentSentence(null)
    setSelectedWords([])
  }

  // 难度切换时，重置故事和计数和已用故事
  const handleDifficultyChange = (e) => {
    const diff = e.target.value
    setDifficulty(diff)
    setUsedSentenceIds([])
    const pool = buildSentencePool(diff, category, allCategories)
    setSentencePool(pool)
    setCurrentSentence(pickSentence(pool, []))
    setSelectedWords([])
  }

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value
    const nextDifficulty = BUILT_IN_UNIT_CATEGORIES[nextCategory] ? '简单' : difficulty
    if (nextDifficulty !== difficulty) {
      setDifficulty(nextDifficulty)
    }
    setCategory(nextCategory)
    setUsedSentenceIds([])
    setManagementNote('')
    const pool = buildSentencePool(nextDifficulty, nextCategory, allCategories)
    setSentencePool(pool)
    setCurrentSentence(pickSentence(pool, []))
    setSelectedWords([])
  }

  const handleOpenManager = () => {
    setManagementNote('')
    setShowManager(true)
  }

  const handleCloseManager = () => {
    setShowManager(false)
    setManagementNote('')
  }

  const handleAddCategory = () => {
    const name = newCategoryName.trim()
    if (!name) {
      setManagementNote('请输入类别名称')
      return
    }
    if (name === '系统类') {
      setManagementNote('“系统类”是保留类别，不能重复创建')
      return
    }
    if (customCategories[name]) {
      setManagementNote(`类别 [${name}] 已存在`)
      return
    }
    if (BUILT_IN_UNIT_CATEGORIES[name]) {
      setManagementNote(`类别 [${name}] 与内置单元重名，请换一个名字`)
      return
    }
    const updated = { ...customCategories, [name]: [] }
    setCustomCategories(updated)
    setCategory(name)
    setNewCategoryName('')
    setUsedStoryIds([])
    setHardCount(0)
    setEasyCount(0)
    refreshStory(null)
    setManagementNote(`已创建类别 [${name}]，请在下方添加故事`)
  }

  const handleDeleteCategory = () => {
    if (!isUserCategory) return
    const removedName = category
    const updated = { ...customCategories }
    delete updated[removedName]
    setCustomCategories(updated)
    setCategory('系统类')
    setUsedSentenceIds([])
    const pool = buildSentencePool(difficulty, '系统类', buildAllCategories(updated))
    setSentencePool(pool)
    setCurrentSentence(pickSentence(pool, []))
    setSelectedWords([])
    setManagementNote(`已删除类别 [${removedName}]`)
  }

  const handleRoundChange = (roundId, field, value) => {
    setStoryForm(prev => ({
      ...prev,
      rounds: prev.rounds.map(round =>
        round.id === roundId ? { ...round, [field]: value } : round
      ),
    }))
  }

  const handleAddRound = () => {
    setStoryForm(prev => ({
      ...prev,
      rounds: [...prev.rounds, createEmptyRound()],
    }))
  }

  const handleRemoveRound = (roundId) => {
    setStoryForm(prev => {
      if (prev.rounds.length === 1) return prev
      return {
        ...prev,
        rounds: prev.rounds.filter(round => round.id !== roundId),
      }
    })
  }

  const handleAddCustomStory = () => {
    if (!isUserCategory) {
      setManagementNote('请先选择或创建一个自定义类别')
      return
    }
    const title = storyForm.title.trim()
    if (!title) {
      setManagementNote('请输入故事标题')
      return
    }
    const formattedRounds = storyForm.rounds
      .map(round => {
        const words = round.wordsInput.split(/\s+/).map(w => w.trim()).filter(Boolean)
        if (words.length === 0) return null
        return {
          words,
          correctSentence: words.join(' '),
          emoji: round.emoji || '',
        }
      })
      .filter(Boolean)
    if (formattedRounds.length === 0) {
      setManagementNote('至少需要一句有效的词语序列')
      return
    }
    const newStory = {
      id: Date.now() + Math.random(),
      title,
      theme: category,
      difficulty: storyForm.difficulty,
      rounds: formattedRounds,
      fullStory: formattedRounds.map(r => r.correctSentence).join(' '),
    }
    const updatedCategoryStories = [...managedStories, newStory]
    const updatedCategories = { ...customCategories, [category]: updatedCategoryStories }
    setCustomCategories(updatedCategories)
    setStoryForm({
      title: '',
      difficulty,
      rounds: [createEmptyRound()],
    })
    setManagementNote(`故事 [${title}] 已添加到 ${category}`)
    if (!story && storyForm.difficulty === difficulty) {
      refreshStory(newStory)
    }
  }

  const handleDeleteCustomStory = (storyId) => {
    if (!isUserCategory) return
    const updatedList = (customCategories[category] || []).filter(item => item.id !== storyId)
    const updatedCategories = { ...customCategories, [category]: updatedList }
    setCustomCategories(updatedCategories)
    setUsedSentenceIds([])
    setManagementNote('故事已删除')
    const pool = buildSentencePool(difficulty, category, buildAllCategories(updatedCategories))
    setSentencePool(pool)
    setCurrentSentence(pickSentence(pool, []))
    setSelectedWords([])
  }

  const current = currentSentence || null
  const shuffledWords = useMemo(() => {
    if (!current) return []
    return shuffle(current.words.map((word, idx) => ({ word, uid: `${current.id || 's'}-${idx}` })))
  }, [current])
  const availableWords = current
    ? shuffledWords.filter(item => !selectedWords.some(selected => selected.uid === item.uid))
    : []

  // 点击词语卡片
  const handleWordClick = (item) => {
    setSelectedWords([...selectedWords, item])
  }

  // 新增：点击已选词语撤销
  const handleRemoveSelectedWord = (idx) => {
    setSelectedWords(selectedWords.filter((_, i) => i !== idx))
  }

  // 朗读句子
  const handleSpeak = () => {
    if (selectedWords.length === 0) return
    const utter = new window.SpeechSynthesisUtterance(selectedWords.map(item => item.word).join(' '))
    utter.lang = 'en-US'
    window.speechSynthesis.speak(utter)
  }

  // 重置本轮
  const handleReset = () => {
    setSelectedWords([])
  }

  // 撤回上一个选择
  const handleUndo = () => {
    setSelectedWords(prev => prev.slice(0, -1))
  }

  // 换一个随机故事（不重复）
  const handleChangeSentence = () => {
    if (!sentencePool.length) return
    const newSentence = pickSentence(sentencePool, [...usedSentenceIds, current?.id].filter(Boolean))
    if (!newSentence) {
      setUsedSentenceIds([])
      setCurrentSentence(pickSentence(sentencePool, []))
      setSelectedWords([])
      return
    }
    setCurrentSentence(newSentence)
    setUsedSentenceIds(prev => current?.id ? [...prev, current.id] : prev)
    setSelectedWords([])
  }

  // 新增：奖励区“下一个故事”按钮（不重复）
  const handleNextStory = () => {
    if (!story) return
    const newStory = pickStoryByDiff(difficulty, [...usedStoryIds, story.id], category, allCategories)
    if (!newStory) {
      setUsedStoryIds([])
      refreshStory(pickStoryByDiff(difficulty, [], category, allCategories))
      return
    }
    refreshStory(newStory)
    setUsedStoryIds(prev => [...prev, story.id])
  }

  // 完成本轮
  const handleNext = () => {
    if (!current) return
    setScore(prev => prev + 1)
    handleChangeSentence()
  }

  // 判断本轮是否完成
  const isCurrentDone = current ? selectedWords.length === current.words.length : false
  // 判断顺序是否正确
  const isOrderCorrect = isCurrentDone && current && selectedWords.map(item => item.word).join(' ') === current.correctSentence
  const noStoryMessage = !current && (isUserCategory || isBuiltInUnitCategory)
    ? (sentencePool.length === 0
      ? (isBuiltInUnitCategory
        ? '该单元暂未提供句子。'
        : '该类别还没有任何英文内容，请点击“修改类别/故事”添加后再开始游戏。')
      : (isBuiltInUnitCategory
        ? '该单元仅提供「简单」难度，请切回简单或选择其他类别。'
        : `该类别在「${difficulty}」难度下暂无句子，请切换难度或点击“修改类别/故事”新增故事。`))
    : null

  return (
    <div className="container">
      <div className="top-nav">
        <Link className="nav-link" to="/">主页</Link>
        <Link className="nav-link" to="/words">单词卡片</Link>
        <Link className="nav-link" to="/sentence-quiz">句子挖空</Link>
      </div>
      <h1>英语小故事拼句</h1>
      <div style={{textAlign: 'center', marginBottom: 8, fontWeight: 'bold', color: '#e65100'}}>分数：{score}</div>
      <div className="category-row">
        <label style={{fontWeight: 'bold'}}>故事类别：</label>
        <select value={category} onChange={handleCategoryChange}>
          <option value="系统类">系统类</option>
          {BUILT_IN_UNIT_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
          {Object.keys(customCategories).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button className="simple-button primary" onClick={handleOpenManager} disabled={isBuiltInUnitCategory}>修改类别/故事</button>
      </div>
      <div style={{marginBottom: 12, textAlign: 'center'}}>
        <label style={{marginRight: 8}}>难度：</label>
        <select value={difficulty} onChange={handleDifficultyChange} style={{fontSize: '1rem', marginRight: 16}} disabled={isBuiltInUnitCategory}>
          <option value="简单">简单</option>
          <option value="中等">中等</option>
          <option value="困难">困难</option>
        </select>
        <span style={{fontWeight: 'bold', color: '#1976d2'}}>{current ? current.correctSentence : '暂无句子'}</span>
        <button onClick={handleChangeSentence} style={{marginLeft: 16, fontSize: '1rem'}} disabled={!current}>换一句</button>
      </div>
      {noStoryMessage && <div className="note warning">{noStoryMessage}</div>}
      {!current ? (
        <div className="empty-state">暂无句子可用，请切换类别或难度。</div>
      ) : (
        <>
          <div style={{fontSize: '2.5rem', margin: '12px 0'}} className={isOrderCorrect ? 'reward-animate' : ''}></div>
          <div className="word-list">
            {availableWords.map((item, idx) => {
              return (
                <div
                  key={item.uid || idx}
                  className="word-card"
                  onClick={() => handleWordClick(item)}
                >
                  {item.word}
                </div>
              )
            })}
          </div>
          <div className={"sentence-bar" + (isOrderCorrect ? ' reward-animate' : '')}>
            {selectedWords.map((item, idx) => (
              <span className="sentence-word" key={item.uid || idx} onClick={() => handleRemoveSelectedWord(idx)} style={{cursor:'pointer'}}>{item.word}</span>
            ))}
          </div>
          <div className="actions">
            <button onClick={handleSpeak} disabled={selectedWords.length === 0}>朗读句子</button>
            <button onClick={handleReset} style={{marginLeft: 8}}>重置</button>
            <button onClick={handleUndo} style={{marginLeft: 8}} disabled={selectedWords.length === 0}>撤回</button>
            <button
              onClick={handleNext}
              style={{marginLeft: 8, background: isOrderCorrect ? '#b6e388' : '#eee', color: isOrderCorrect ? '#2e7d32' : '#aaa'}}
              disabled={!isOrderCorrect}
            >
              下一句
            </button>
          </div>
          <div style={{marginTop: 12, color: isCurrentDone ? (isOrderCorrect ? '#2e7d32' : 'crimson') : '#888'}}>
            {isCurrentDone ? (isOrderCorrect ? '✅ 顺序正确！' : '❌ 顺序不对，请重试') : '请点击词语组成句子'}
          </div>
          {isOrderCorrect && (
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
              中文：{current?.translation || '暂无中文译文'}
            </div>
          )}
        </>
      )}

      {showManager && (
        <div className="manager-modal">
          <div className="manager-content">
            <div className="manager-header">
              <h3>类别与故事管理</h3>
              <button className="simple-button" onClick={handleCloseManager}>关闭</button>
            </div>
            <div className="manager-section">
              <label className="manager-label">当前类别</label>
              <div className="manager-row">
                <select value={category} onChange={handleCategoryChange} className="custom-select">
                  <option value="系统类">系统类</option>
                  {BUILT_IN_UNIT_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {Object.keys(customCategories).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="manager-row">
                <input
                  className="custom-text-input"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="新类别名称"
                />
                <button className="simple-button primary" onClick={handleAddCategory}>新增类别</button>
                <button className="simple-button danger" onClick={handleDeleteCategory} disabled={!isUserCategory}>删除当前类别</button>
              </div>
              <p className="helper-text">“系统类”和 Level/Unit 单元类别为内置英文故事，仅供选择游玩；若需自定义内容，请创建自定义类别再添加故事。</p>
              {managementNote && <div className="note">{managementNote}</div>}
            </div>
            {isUserCategory ? (
              <>
                <div className="manager-section">
                  <h4>添加新故事</h4>
                  <p className="helper-text">词语请用空格分开，例如：<code>I like red apples</code></p>
                  <div className="custom-form-row">
                    <label>故事标题</label>
                    <input
                      className="custom-text-input"
                      value={storyForm.title}
                      onChange={e => setStoryForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="请输入故事标题"
                    />
                  </div>
                  <div className="custom-form-row">
                    <label>故事难度</label>
                    <select
                      className="custom-select"
                      value={storyForm.difficulty}
                      onChange={e => setStoryForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="简单">简单</option>
                      <option value="中等">中等</option>
                      <option value="困难">困难</option>
                    </select>
                  </div>
                  <div className="custom-form-row">
                    <label>句子列表（每行一个句子，词语以空格分隔）</label>
                    <div className="custom-rounds">
                      {storyForm.rounds.map(round => (
                        <div className="custom-round-row" key={round.id}>
                          <input
                        className="custom-text-input"
                        value={round.wordsInput}
                        onChange={e => handleRoundChange(round.id, 'wordsInput', e.target.value)}
                        placeholder="例如：I like red apples"
                          />
                          <input
                            className="custom-text-input"
                            value={round.emoji}
                            onChange={e => handleRoundChange(round.id, 'emoji', e.target.value)}
                            placeholder="表情/插画（可选）"
                          />
                          {storyForm.rounds.length > 1 && (
                            <button type="button" className="simple-button danger" onClick={() => handleRemoveRound(round.id)}>删除</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="simple-button" onClick={handleAddRound}>添加一句</button>
                    </div>
                  </div>
                  <button type="button" className="simple-button primary" onClick={handleAddCustomStory}>保存故事到 {category}</button>
                </div>
                <div className="manager-section">
                  <h4>{category} 已有故事</h4>
                  {managedStories.length === 0 ? (
                    <p className="helper-text">暂未添加故事，添加后可在主页面开始挑战。</p>
                  ) : (
                    managedStories.map(item => (
                      <div className="custom-story-item" key={item.id}>
                        <div>
                          <div><strong>{item.title}</strong>（{item.difficulty}）</div>
                          <div className="custom-story-sentences">
                            {item.rounds.map((round, idx) => (
                              <span key={idx}>{round.correctSentence}{idx < item.rounds.length - 1 ? ' / ' : ''}</span>
                            ))}
                          </div>
                        </div>
                        <button className="simple-button danger" onClick={() => handleDeleteCustomStory(item.id)}>删除</button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="note warning">系统类和 Level/Unit 单元故事为内置内容，可直接游玩；如需自定义内容，请切换到自定义类别进行管理。</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
