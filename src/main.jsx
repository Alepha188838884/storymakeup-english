import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home.jsx'
import App from './App.jsx'         // 拼故事
import WordQuiz from './WordQuiz.jsx' // 单词卡片
import TeacherApp from './TeacherApp.jsx'   // 教师端
import SpeechTest from './SpeechTest.jsx'
import WordTest from './WordTest.jsx'
import SentenceQuiz from './SentenceQuiz.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<App />} />
        <Route path="/words" element={<WordQuiz />} />
        <Route path="/speech" element={<SpeechTest />} />
        <Route path="/test" element={<WordTest />} />
        <Route path="/sentence-quiz" element={<SentenceQuiz />} />
        <Route path="/teacher" element={<TeacherApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
