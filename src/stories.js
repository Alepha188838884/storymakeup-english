const EASY_COUNT = 1000
const MEDIUM_COUNT = 1000
const HARD_COUNT = 1000

const pools = {
  colors: ['red', 'blue', 'green', 'yellow', 'pink'],
  animals: ['cat', 'dog', 'bird', 'duck', 'cow', 'goat'],
  toys: ['ball', 'kite', 'car', 'train', 'doll'],
  foods: ['eggs', 'rice', 'bread', 'noodles', 'soup'],
  drinks: ['milk', 'water', 'juice'],
  friends: ['Mia', 'Leo', 'Lily', 'Tom', 'Amy', 'Ben'],
  places: ['park', 'yard', 'garden', 'school', 'room'],
  weather: ['sunny', 'cloudy', 'rainy'],
  chores: ['wash', 'sweep', 'tidy', 'wipe', 'fold'],
  fruits: ['apple', 'banana', 'pear', 'grape', 'peach'],
}

const poolsCn = {
  colors: ['红色的', '蓝色的', '绿色的', '黄色的', '粉色的'],
  animals: ['猫', '狗', '小鸟', '小鸭', '奶牛', '山羊'],
  toys: ['球', '风筝', '小汽车', '火车', '娃娃'],
  foods: ['鸡蛋', '米饭', '面包', '面条', '汤'],
  drinks: ['牛奶', '水', '果汁'],
  friends: ['米娅', '里奥', '莉莉', '汤姆', '艾米', '本'],
  places: ['公园', '院子', '花园', '学校', '房间'],
  weather: ['晴朗', '多云', '下雨'],
  chores: ['清洗', '扫地', '整理', '擦拭', '折叠'],
  fruits: ['苹果', '香蕉', '梨子', '葡萄', '桃子'],
}

const pick = (list, idx) => list[idx % list.length]

const easyTemplates = [
  {
    title: 'Play in the Park',
    theme: 'Play',
    rounds: [
      { words: ['I', 'see', 'a', '{color}', '{animal}'], emoji: '😊', cnTemplate: '我看到一只{color}{animal}。' },
      { words: ['It', 'plays', 'with', 'a', '{toy}'], emoji: '⚽', cnTemplate: '它在玩一个{toy}。' },
      { words: ['We', 'run', 'in', 'the', '{place}'], emoji: '🏃', cnTemplate: '我们在{place}里跑。' },
    ],
  },
  {
    title: 'Breakfast Time',
    theme: 'Home',
    rounds: [
      { words: ['Mom', 'cooks', 'warm', '{food}'], emoji: '🍳', cnTemplate: '妈妈煮热乎的{food}。' },
      { words: ['I', 'drink', '{drink}'], emoji: '🥛', cnTemplate: '我喝{drink}。' },
      { words: ['We', 'eat', 'at', 'the', 'table'], emoji: '🍽️', cnTemplate: '我们在餐桌旁吃饭。' },
    ],
  },
  {
    title: 'Sunny Walk',
    theme: 'Daily',
    rounds: [
      { words: ['The', 'day', 'is', '{weather}'], emoji: '☀️', cnTemplate: '今天是{weather}的天气。' },
      { words: ['I', 'walk', 'with', '{friend}', 'to', 'school'], emoji: '🚶', cnTemplate: '我和{friend}一起走去学校。' },
      { words: ['We', 'read', 'a', 'small', 'book'], emoji: '📖', cnTemplate: '我们读一本小书。' },
    ],
  },
]

const mediumTemplates = [
  {
    title: 'Helping at Home',
    theme: 'Home',
    rounds: [
      { words: ['I', '{chore}', 'the', 'cups', 'with', 'warm', 'water'], emoji: '💦', cnTemplate: '我用温水{chore}杯子。' },
      { words: ['My', 'friend', 'wipes', 'the', 'table'], emoji: '🧽', cnTemplate: '我的朋友擦桌子。' },
      { words: ['We', 'put', 'books', 'back', 'on', 'the', 'shelf'], emoji: '📚', cnTemplate: '我们把书放回书架。' },
    ],
  },
  {
    title: 'Garden Day',
    theme: 'Nature',
    rounds: [
      { words: ['We', 'plant', 'a', '{color}', 'seed'], emoji: '🌱', cnTemplate: '我们种下一颗{color}种子。' },
      { words: ['A', '{color}', 'sprout', 'comes', 'out'], emoji: '🌿', cnTemplate: '一株{color}的小芽冒出来。' },
      { words: ['We', 'water', 'the', 'small', 'plant'], emoji: '💧', cnTemplate: '我们给小苗浇水。' },
    ],
  },
  {
    title: 'Fun at School',
    theme: 'School',
    rounds: [
      { words: ['Teacher', 'shows', 'a', '{color}', 'card'], emoji: '🖼️', cnTemplate: '老师展示一张{color}的卡片。' },
      { words: ['I', 'spell', 'a', '{fruit}', 'word'], emoji: '🔤', cnTemplate: '我拼出一个{fruit}单词。' },
      { words: ['We', 'sing', 'a', 'happy', 'song'], emoji: '🎵', cnTemplate: '我们唱一首快乐的歌。' },
    ],
  },
]

const hardTemplates = [
  {
    title: 'Trip to the Farm',
    theme: 'Travel',
    rounds: [
      { words: ['We', 'take', 'a', 'bus', 'to', 'the', 'farm'], emoji: '🚌', cnTemplate: '我们坐公交去农场。' },
      { words: ['I', 'feed', 'a', 'baby', '{animal}', 'with', 'milk'], emoji: '🥛', cnTemplate: '我用牛奶喂一只小{animal}。' },
      { words: ['The', 'farmer', 'shows', 'us', 'fresh', 'eggs'], emoji: '🥚', cnTemplate: '农夫给我们看新鲜的鸡蛋。' },
    ],
  },
  {
    title: 'Rainy Adventure',
    theme: 'Weather',
    rounds: [
      { words: ['The', 'sky', 'is', '{weather}'], emoji: '🌧️', cnTemplate: '天空是{weather}。' },
      { words: ['Dad', 'brings', 'a', 'big', 'umbrella'], emoji: '☔', cnTemplate: '爸爸带来一把大伞。' },
      { words: ['We', 'walk', 'slowly', 'to', 'the', '{place}'], emoji: '🚶', cnTemplate: '我们慢慢走向{place}。' },
    ],
  },
  {
    title: 'Night Story',
    theme: 'Night',
    rounds: [
      { words: ['I', 'look', 'at', 'the', '{color}', 'stars'], emoji: '🌟', cnTemplate: '我看着{color}的星星。' },
      { words: ['We', 'tell', 'a', 'short', 'story', 'with', 'a', 'light'], emoji: '🔦', cnTemplate: '我们打着灯讲一个小故事。' },
      { words: ['I', 'sleep', 'well', 'after', 'the', 'talk'], emoji: '😴', cnTemplate: '讲完故事我睡得很香。' },
    ],
  },
]

const fillWord = (word, idx) => {
  switch (word) {
    case '{color}':
      return pick(pools.colors, idx)
    case '{animal}':
      return pick(pools.animals, idx)
    case '{toy}':
      return pick(pools.toys, idx)
    case '{food}':
      return pick(pools.foods, idx)
    case '{drink}':
      return pick(pools.drinks, idx)
    case '{friend}':
      return pick(pools.friends, idx)
    case '{place}':
      return pick(pools.places, idx)
    case '{weather}':
      return pick(pools.weather, idx)
    case '{chore}':
      return pick(pools.chores, idx)
    case '{fruit}':
      return pick(pools.fruits, idx)
    default:
      return word
  }
}

const fillWordCn = (word, idx) => {
  switch (word) {
    case '{color}':
      return pick(poolsCn.colors, idx)
    case '{animal}':
      return pick(poolsCn.animals, idx)
    case '{toy}':
      return pick(poolsCn.toys, idx)
    case '{food}':
      return pick(poolsCn.foods, idx)
    case '{drink}':
      return pick(poolsCn.drinks, idx)
    case '{friend}':
      return pick(poolsCn.friends, idx)
    case '{place}':
      return pick(poolsCn.places, idx)
    case '{weather}':
      return pick(poolsCn.weather, idx)
    case '{chore}':
      return pick(poolsCn.chores, idx)
    case '{fruit}':
      return pick(poolsCn.fruits, idx)
    default:
      return word
  }
}

const fillTemplate = (template, idx, isCn = false) => {
  if (!template) return ''
  return template.replace(/\{[^}]+\}/g, (match) => (isCn ? fillWordCn(match, idx) : fillWord(match, idx)))
}

const buildRounds = (rounds, variantIndex) => {
  return rounds.map(round => {
    const words = round.words.map(word => fillWord(word, variantIndex))
    return {
      words,
      correctSentence: words.join(' '),
      emoji: round.emoji || '',
      translation: fillTemplate(round.cnTemplate, variantIndex, true),
    }
  })
}

const buildStory = (template, difficulty, variantIndex) => {
  const rounds = buildRounds(template.rounds, variantIndex)
  return {
    id: `${difficulty}-${variantIndex + 1}`,
    title: `${template.title} ${String(variantIndex + 1).padStart(3, '0')}`,
    theme: template.theme,
    difficulty,
    rounds,
    fullStory: rounds.map(r => r.correctSentence).join('. ') + '.',
  }
}

const generateStories = (difficulty, count, templates) => {
  const list = []
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length]
    list.push(buildStory(tpl, difficulty, i))
  }
  return list
}

const easyStories = generateStories('简单', EASY_COUNT, easyTemplates)
const mediumStories = generateStories('中等', MEDIUM_COUNT, mediumTemplates)
const hardStories = generateStories('困难', HARD_COUNT, hardTemplates)

export const stories = [...easyStories, ...mediumStories, ...hardStories]

export const themes = stories.reduce((acc, story) => {
  if (!acc[story.theme]) acc[story.theme] = []
  acc[story.theme].push(story)
  return acc
}, {})

export const difficulties = {
  '简单': easyStories,
  '中等': mediumStories,
  '困难': hardStories,
}

export const getRandomStory = () => {
  return stories[Math.floor(Math.random() * stories.length)]
}

export const getStoriesByTheme = (theme) => {
  return stories.filter(story => story.theme === theme)
}

export const getStoriesByDifficulty = (difficulty) => {
  return difficulties[difficulty] || []
}
