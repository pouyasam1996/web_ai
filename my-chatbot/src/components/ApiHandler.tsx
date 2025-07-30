import axios from 'axios';

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  url?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
}

interface ApiResponse {
  choices?: { message: { content: string } }[];
  content?: string; // For Claude
}

interface RequestBody {
  model: string;
  messages: Message[];
  max_tokens?: number;
}

interface OpenAIHeaders {
  Authorization: string;
  'Content-Type': string;
}

interface AnthropicHeaders {
  'x-api-key': string;
  'anthropic-version': string;
  'Content-Type': string;
}

type Headers = OpenAIHeaders | AnthropicHeaders;

// DEBUG: Function to estimate token count
const estimateTokenCount = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
};

// DEBUG: Function to analyze message size
const analyzeMessageSize = (message: Message): void => {
  console.log('🔍 MESSAGE SIZE ANALYSIS:');
  console.log(`Text content: ${message.content.length} chars (≈${estimateTokenCount(message.content)} tokens)`);

  if (message.files && message.files.length > 0) {
    let totalFileSize = 0;
    message.files.forEach((file, index) => {
      const fileTokens = estimateTokenCount(file.content);
      totalFileSize += fileTokens;
      console.log(`File ${index + 1} (${file.name}): ${file.content.length} chars (≈${fileTokens} tokens)`);

      if (file.type.startsWith('image/')) {
        console.log(`  📸 Image - Original size: ${(file.size / 1024).toFixed(1)}KB, Base64 size: ${(file.content.length / 1024).toFixed(1)}KB`);
      }
    });
    console.log(`Total file tokens: ≈${totalFileSize}`);
    console.log(`TOTAL MESSAGE TOKENS: ≈${estimateTokenCount(message.content) + totalFileSize}`);
  }
};

const formatMessageContent = (message: Message): string => {
  let content = message.content;

  // DEBUG: Analyze message size before processing
  analyzeMessageSize(message);

  // Add file information to the message content for API
  if (message.files && message.files.length > 0) {
    const fileInfo = message.files.map(file => {
      if (file.type.startsWith('image/')) {
        // For images, include base64 data
        console.log(`🖼️ Adding image to API request: ${file.name} (${file.content.length} chars)`);
        return `[Image: ${file.name}] - ${file.content}`;
      } else {
        // For other files, include text content
        console.log(`📄 Adding file to API request: ${file.name} (${file.content.length} chars)`);
        return `[File: ${file.name}]\n${file.content}`;
      }
    }).join('\n\n');

    content = content + '\n\n' + fileInfo;
  }

  const finalTokens = estimateTokenCount(content);
  console.log(`📤 FINAL API MESSAGE: ${content.length} chars (≈${finalTokens} tokens)`);

  // WARNING: Check if message is too large
  if (finalTokens > 100000) { // 100k tokens is very large
    console.warn(`⚠️ WARNING: Message is very large (≈${finalTokens} tokens). This might cause API errors.`);
  }

  return content;
};

export const sendToAPI = async (
  messages: Message[],
  model: string,
  gptModel: string,
  apiKey: string
): Promise<string> => {
  let url = '';
  let headers: Headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  // Format messages for API (remove files property, include content in message)
  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: formatMessageContent(msg)
  }));

  // DEBUG: Log total conversation size
  const totalTokens = apiMessages.reduce((sum, msg) => sum + estimateTokenCount(msg.content), 0);
  console.log(`📊 TOTAL CONVERSATION SIZE: ≈${totalTokens} tokens`);

  let body: RequestBody = { model: gptModel, messages: apiMessages };

  if (model === 'gpt') {
    url = 'https://api.openai.com/v1/chat/completions';
  } else if (model === 'claude') {
    url = 'https://api.anthropic.com/v1/messages';
    headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
    body = { model: 'claude-3-5-sonnet-20241022', messages: apiMessages, max_tokens: 1000 };
  } else if (model === 'grok') {
    url = 'https://api.x.ai/v1/chat/completions';
    body = { model: 'grok-beta', messages: apiMessages };
  }

  console.log('🚀 API Request:', { url, model, messageCount: apiMessages.length, estimatedTokens: totalTokens });

  try {
    const response = await axios.post<ApiResponse>(url, body, { headers });
    const aiReply = response.data.choices ? response.data.choices[0].message.content : response.data.content;
    console.log('✅ API Response received');
    return aiReply || 'No response';
  } catch (error: any) {
    console.error('❌ API Error:', error.response?.data?.error || error.message);

    // Better error handling
    if (error.response?.status === 413) {
      throw new Error('Request too large - try reducing image sizes or removing some files');
    } else if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('token')) {
      throw new Error('Token limit exceeded - try reducing message length or file sizes');
    } else {
      throw new Error(error.response?.data?.error?.message || 'Unknown API error');
    }
  }
};