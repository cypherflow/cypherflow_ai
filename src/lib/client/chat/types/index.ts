export enum NDKChatKind {
	CHAT_CONTAINER = 30101,
	BRANCH_CONTAINER = 1102,
	MESSAGE = 1103,
  MODEL_DETAILS = 30078
}

export enum MessageRole {
	SYSTEM = 'system',
	USER = 'user',
	ASSISTANT = 'assistant',
	DATA = 'data'
}

/**
Represents the number of tokens used in a prompt and completion.
 */
export type LanguageModelUsage = {
    /**
  The number of tokens used in the prompt.
     */
    promptTokens: number;
    /**
  The number of tokens used in the completion.
   */
    completionTokens: number;
    /**
  The total number of tokens used (promptTokens + completionTokens).
     */
    totalTokens: number;
};

/**
Reason why a language model finished generating a response.

Can be one of the following:
- `stop`: model generated stop sequence
- `length`: model generated maximum number of tokens
- `content-filter`: content filter violation stopped the model
- `tool-calls`: model triggered tool calls
- `error`: model stopped because of an error
- `other`: model stopped for other reasons
- `unknown`: the model has not transmitted a finish reason
 */
export type LanguageModelV1FinishReason = 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';
