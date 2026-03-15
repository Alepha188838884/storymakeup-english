import React from 'react'
import { Link } from 'react-router-dom'
import './App.css'

function Home() {
  return (
    <div className="landing">
      <div className="top-nav">
        <Link className="nav-link" to="/play">直接开始拼故事</Link>
        <Link className="nav-link" to="/words">去单词卡片</Link>
      </div>
      <h1>上海惠立稀有心声社团英语课</h1>
      <p className="landing-subtitle">为孩子准备的简单英语练习：拼句子闯关 + 卡片背单词</p>
      <p style={{ marginTop: -6, marginBottom: 16, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
        Designed by Eric Huang
      </p>
      <div className="landing-cards">
        <div className="landing-card">
          <h3>单词卡片</h3>
          <Link className="secondary-btn" to="/words">开始背单词</Link>
        </div>
        <div className="landing-card">
          <h3>拼故事</h3>
          <Link className="primary-btn" to="/play">进入拼句模式</Link>
        </div>
      </div>
    </div>
  )
}

export default Home
