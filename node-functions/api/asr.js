/* global process */

import { Buffer } from 'node:buffer'
import tencentAsrSdk from 'tencentcloud-sdk-nodejs-asr'

const { asr } = tencentAsrSdk
const AsrClient = asr.v20190614.Client

const DEFAULT_REGION = 'ap-shanghai'
const DEFAULT_ENGINE = '16k_en'
const MAX_AUDIO_BYTES = 2 * 1024 * 1024

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  })

const readEnv = (context = {}) => ({
  ...process.env,
  ...(context.env || {}),
})

const getRequiredConfig = (context) => {
  const env = readEnv(context)
  const secretId = env.TENCENTCLOUD_SECRET_ID
  const secretKey = env.TENCENTCLOUD_SECRET_KEY

  if (!secretId || !secretKey) {
    throw new Error('服务端未配置腾讯云 ASR 密钥环境变量。')
  }

  return {
    secretId,
    secretKey,
    region: env.TENCENTCLOUD_REGION || DEFAULT_REGION,
    engSerViceType: env.TENCENTCLOUD_ASR_ENG_SERVICE_TYPE || DEFAULT_ENGINE,
  }
}

const createClient = (config) =>
  new AsrClient({
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey,
    },
    region: config.region,
    profile: {
      signMethod: 'TC3-HMAC-SHA256',
      httpProfile: {
        reqMethod: 'POST',
        reqTimeout: 15,
      },
    },
  })

const handleAsrRequest = async (context) => {
  const { request } = context
  const contentType = request.headers.get('content-type') || ''

  if (!contentType.includes('audio/wav')) {
    return json(
      {
        error: 'unsupported_format',
        message: '仅支持 audio/wav 格式的录音上传。',
      },
      415
    )
  }

  const audioArrayBuffer = await request.arrayBuffer()
  if (!audioArrayBuffer.byteLength) {
    return json(
      {
        error: 'empty_audio',
        message: '没有收到录音数据，请重试。',
      },
      400
    )
  }

  const audioBuffer = Buffer.from(audioArrayBuffer)
  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    return json(
      {
        error: 'audio_too_large',
        message: '录音过长，请控制在 5 秒内。',
      },
      413
    )
  }

  const config = getRequiredConfig(context)
  const client = createClient(config)
  const response = await client.SentenceRecognition({
    EngSerViceType: config.engSerViceType,
    SourceType: 1,
    VoiceFormat: 'wav',
    Data: audioBuffer.toString('base64'),
    DataLen: audioBuffer.length,
  })

  return json({
    transcript: response.Result || '',
    audioDuration: response.AudioDuration || 0,
    requestId: response.RequestId || '',
  })
}

export async function onRequest(context) {
  try {
    if (context.request.method !== 'POST') {
      return json(
        {
          error: 'method_not_allowed',
          message: '仅支持 POST 请求。',
        },
        405
      )
    }

    return await handleAsrRequest(context)
  } catch (error) {
    console.error('Tencent ASR request failed:', error)

    return json(
      {
        error: 'asr_failed',
        message: error?.message || '腾讯云 ASR 调用失败，请稍后重试。',
      },
      502
    )
  }
}

export async function onRequestPost(context) {
  return onRequest(context)
}
