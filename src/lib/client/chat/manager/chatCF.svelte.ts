import { createDebug } from '$lib/utils/debug';
import { Chat } from '@ai-sdk/svelte';
import {
  AbstractChat,
  DefaultChatTransport,
  type ChatInit,
  // type ChatState,
  // type ChatStatus,
  type CreateUIMessage,
  type UIMessage,
} from 'ai';

export type { CreateUIMessage, UIMessage };

const d = createDebug('chatCF')


export class ChatCF<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends Chat<UI_MESSAGE> {

  public isNewChat: boolean = false;
  public inputText: string = $state<string>('');
  public title: string = 'New Chat';



  constructor(chatId?: string) {
    let init: ChatInit<UI_MESSAGE> = {
      transport: new DefaultChatTransport({
        api: "http://localhost:3000/api/chat",
        headers: { 'Custom-Header': 'value' },
      })
    }

    if (chatId) {
      init.id = chatId;
    }


    super({
      ...init,
    });

    this.isNewChat = !chatId;
  }

  destroy(): void {
    d.log('ChatSession destroyed')
  }
}
