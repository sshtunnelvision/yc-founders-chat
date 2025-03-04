import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { customProvider } from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'gpt-4-turbo';

export const myProvider = customProvider({
  languageModels: {
    // OpenAI Models
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'gpt-4.5': openai('gpt-4.5'),
    'title-model': openai('gpt-4o'),
    
    // Anthropic Models
    'claude-3.7-sonnet': anthropic('claude-3-7-sonnet-20250219'),
    'claude-3.5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
    
    // Google Models
    'gemini-2.0': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro-latest'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Lightweight OpenAI model',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Flagship OpenAI model',
  },
  {
    id: 'gpt-4.5',
    name: 'GPT-4.5',
    description: 'Most advanced OpenAI model',
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Latest Claude model with enhanced capabilities',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanced Claude model for general use',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0',
    description: 'Google\'s fastest flash model',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s advanced pro model',
  },
];
