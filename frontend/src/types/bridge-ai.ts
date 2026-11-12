/**
 * TypeScript Interfaces for BridgeAI Career Assistant.
 */

export interface BridgeAISource {
  title: string;
  source: string;
  category?: string;
  relevance_score?: number;
}

export interface BridgeAIMessageMetadata {
  sources?: BridgeAISource[];
  follow_ups?: string[];
  provider?: string;
  model?: string;
  latency_ms?: number;
  is_mock?: boolean;
}

export interface BridgeAIMessage {
  id: number | string;
  sender_role: "user" | "assistant" | "system";
  content: string;
  metadata?: BridgeAIMessageMetadata;
  created_at: string | null;
}

export interface BridgeAIConversationSummary {
  id: string;
  title: string;
  context_type: string;
  message_count: number;
  created_at: string | null;
  last_message_at: string | null;
}

export interface BridgeAIConversationDetail {
  id: string;
  title: string;
  context_type: string;
  created_at: string | null;
  messages: BridgeAIMessage[];
}

export interface BridgeAIMessageSendResponse {
  conversation_id: string;
  user_message: BridgeAIMessage;
  assistant_message: BridgeAIMessage;
}

