import React, { useState, useRef, useEffect } from "react";

// 自定义分词规则，和 stories.js 一致，支持按句号分句
function breakDownLikeStories(text) {
  const splitWords = ["是", "的", "了", "在", "和", "把", "被", "有", "会", "能", "要", "就", "也", "还", "都", "但", "而", "或", "与", "及", "并", "为"];
  // 按句号、问号、感叹号（中英文）分句
  const sentences = text
    .replace(/([。！？!?\\.])/g, '$1\n')
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);
  // 每句分词
  return sentences.map(sentence => {
    let s = sentence;
    splitWords.forEach(word => {
      s = s.replace(new RegExp(word, "g"), ` ${word} `);
    });
    s = s.replace(/\s+/g, " ").trim();
    return s.split(" ").filter(Boolean);
  });
}

function TeacherSentenceAdder({ onAdd }) {
  const [sentence, setSentence] = useState("");
  const [wordsList, setWordsList] = useState([]); // 多句分词
  const [difficulty, setDifficulty] = useState("简单");
  // refs for input and span
  const inputRefs = useRef([]);
  const spanRefs = useRef([]);
  const [inputWidths, setInputWidths] = useState([]);

  // 输入后自动分句分词
  const handleSentenceChange = (e) => {
    const value = e.target.value;
    setSentence(value);
    const newWordsList = breakDownLikeStories(value);
    setWordsList(newWordsList);
  };

  // 编辑某句某词
  const handleWordChange = (lineIdx, wordIdx, newWord) => {
    const newWordsList = wordsList.map((line, i) =>
      i === lineIdx ? line.map((w, j) => (j === wordIdx ? newWord : w)) : line
    );
    setWordsList(newWordsList);
  };

  // 删除某句某词
  const handleDeleteWord = (lineIdx, wordIdx) => {
    const newWordsList = wordsList.map((line, i) =>
      i === lineIdx ? line.filter((_, j) => j !== wordIdx) : line
    );
    setWordsList(newWordsList);
  };

  // 插入新词
  const handleInsertWord = (lineIdx, wordIdx) => {
    const newWordsList = wordsList.map((line, i) =>
      i === lineIdx ? [...line.slice(0, wordIdx + 1), "", ...line.slice(wordIdx + 1)] : line
    );
    setWordsList(newWordsList);
  };

  // 动态调整input宽度
  useEffect(() => {
    const widths = wordsList.map((line, lineIdx) =>
      line.map((word, wordIdx) => {
        const span = spanRefs.current?.[lineIdx]?.[wordIdx];
        return span ? span.offsetWidth + 8 : 20; // padding
      })
    );
    setInputWidths(widths);
  }, [wordsList]);

  // 保证refs结构和wordsList一致
  useEffect(() => {
    inputRefs.current = wordsList.map((line, i) => inputRefs.current[i] || []);
    spanRefs.current = wordsList.map((line, i) => spanRefs.current[i] || []);
  }, [wordsList]);

  // 添加句子
  const handleAdd = () => {
    if (!sentence.trim() || wordsList.length === 0) return;
    // 组装每句
    const data = wordsList.map(words => ({
      words,
      correctSentence: words.join(''),
      difficulty,
      emoji: "",
    }));
    if (onAdd) {
      onAdd(data);
    }
    setSentence("");
    setWordsList([]);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 24, borderRadius: 8, maxWidth: 700 }}>
      <h2>添加英文句子</h2>
      <textarea
        value={sentence}
        onChange={handleSentenceChange}
        placeholder="输入英文句子，可多句，每句自动分行"
        rows={3}
        style={{ width: "100%", marginBottom: 12 }}
      />
      <div style={{ marginBottom: 12 }}>
        <span>自动拆词（可编辑）：</span>
        <div style={{ marginTop: 8 }}>
          {wordsList.map((words, lineIdx) => (
            <div key={lineIdx} style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {words.map((word, wordIdx) => (
                <span key={wordIdx} style={{ display: "flex", alignItems: "center", position: 'relative' }}>
                  <input
                    value={word}
                    onChange={e => handleWordChange(lineIdx, wordIdx, e.target.value)}
                    style={{
                      width: inputWidths?.[lineIdx]?.[wordIdx] || 20,
                      marginRight: 2,
                      padding: '2px 4px',
                      boxSizing: 'content-box',
                      font: 'inherit'
                    }}
                    ref={el => {
                      if (!inputRefs.current[lineIdx]) inputRefs.current[lineIdx] = [];
                      inputRefs.current[lineIdx][wordIdx] = el;
                    }}
                  />
                  <span
                    ref={el => {
                      if (!spanRefs.current[lineIdx]) spanRefs.current[lineIdx] = [];
                      spanRefs.current[lineIdx][wordIdx] = el;
                    }}
                    style={{
                      position: 'absolute',
                      visibility: 'hidden',
                      whiteSpace: 'pre',
                      font: 'inherit',
                      padding: '2px 4px',
                    }}
                  >
                    {word || ' '}
                  </span>
                  <button onClick={() => handleDeleteWord(lineIdx, wordIdx)} style={{ marginRight: 2 }}>❌</button>
                  <button onClick={() => handleInsertWord(lineIdx, wordIdx)}>➕</button>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <span>选择难度：</span>
        {["简单", "中等", "困难"].map(d => (
          <label key={d} style={{ marginRight: 12 }}>
            <input
              type="radio"
              value={d}
              checked={difficulty === d}
              onChange={() => setDifficulty(d)}
            />
            {d}
          </label>
        ))}
      </div>
      <button onClick={handleAdd} style={{ padding: "6px 18px", fontSize: 16 }}>添加</button>
    </div>
  );
}

export default function TeacherApp() {
  const [sentences, setSentences] = useState([]);

  return (
    <div style={{ padding: 32 }}>
      <h1>教师端英文句子添加</h1>
      <TeacherSentenceAdder
        onAdd={data => setSentences([...sentences, ...data])}
      />
      <h3 style={{ marginTop: 32 }}>已添加句子：</h3>
      <ul>
        {sentences.map((item, idx) => (
          <li key={idx} style={{ marginBottom: 12 }}>
            <b>{item.correctSentence}</b>（难度：{item.difficulty}）<br />
            分词：{JSON.stringify(item.words)}
          </li>
        ))}
      </ul>
    </div>
  );
} 
