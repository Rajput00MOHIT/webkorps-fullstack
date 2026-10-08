export interface SourceItem {
  id?: string;
  index: string;
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface ChatAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface ChatMessageData {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  actions?: ChatAction[];
  citations?: Array<{
    title: string;
    url: string;
    domain?: string;
    snippet?: string;
  }>;
  route?: string;
}

export interface ExamplePromptItem {
  id: string;
  text: string;
}

export interface AiResponseResult {
  text: string;
  actions?: ChatAction[];
}
