import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { customProvider } from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini';

export const myProvider = customProvider({
  languageModels: {
    // OpenAI Models
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'gpt-4.5-preview': openai('gpt-4.5-preview-2025-02-27'),
    'title-model': openai('gpt-4o'),
    'artifact-model': openai('gpt-4o'),

    
    // Anthropic Models
    'claude-3.7-sonnet': anthropic('claude-3-7-sonnet-20250219'),
    'claude-3.5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
    
    
    // Google Models
    'gemini-2.0': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro-latest'),
  },
});

type ArtifactType = 'text' | 'code' | 'image' | 'sheet';

interface ChatModel {
  id: string;
  name: string;
  description: string;
  available: boolean;
  artifacts: Array<ArtifactType>;
}

// Only export models that are available
export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Lightweight OpenAI model',
    available: true,
    artifacts: ['text', 'code'] as Array<ArtifactType>,
  },
  {
    id: 'gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    description: 'Latest OpenAI preview model with enhanced capabilities',
    available: true,
    artifacts: ['text', 'code', 'image', 'sheet'] as Array<ArtifactType>,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Flagship OpenAI model',
    available: true,
    artifacts: ['text', 'code', 'image', 'sheet'] as Array<ArtifactType>,
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Best coding model based on accepted benchmarks/evaluations',
    available: true,
    artifacts: ['text', 'code', 'sheet'] as Array<ArtifactType>,
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s flagship coding model',
    available: true,
    artifacts: ['text', 'code', 'sheet'] as Array<ArtifactType>,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0',
    description: 'Google\'s fastest flash model',
    available: true,
    artifacts: ['text', 'code', 'image'] as Array<ArtifactType>,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s advanced pro model',
    available: true,
    artifacts: ['text', 'code', 'image', 'sheet'] as Array<ArtifactType>,
  },
].filter(model => model.available);
