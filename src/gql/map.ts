import {gql} from '@apollo/client';

// Base types
interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatMessages {
    messages: Message[];
}

export interface WamexChat {
    id: number;
    messages: ChatMessages;
    created_at: string;
    chat_uuid: string;
    updated_at: string;
}

// Response types
export interface GetChatsResponse {
    wamex_chat: WamexChat[];
}

export interface GetChatByIdResponse {
    wamex_chat_by_pk: WamexChat;
}

export interface CreateChatResponse {
    insert_wamex_chat_one: WamexChat;
}

export interface UpdateChatResponse {
    update_wamex_chat: {
        returning: WamexChat[];
    };
}

// Variables types
export interface ChatSubscriptionVariables {
    chat_uuid: string;
}

export interface CreateChatVariables {
    messages: ChatMessages;
    chat_uuid: string;
}

export interface UpdateChatVariables {
    chat_uuid: string;
    messages: ChatMessages;
}

export const SUB_CHAT_BY_UUID = gql`
  subscription GetChatByUuid($chat_uuid: uuid!) {
    wamex_chat(where: {chat_uuid: {_eq: $chat_uuid}}) {
      id
      messages
      created_at
      chat_uuid
      updated_at
    }
  }
`;

export const CREATE_CHAT = gql`
  mutation CreateChat($messages: jsonb!, $chat_uuid: uuid!) {
    insert_wamex_chat_one(object: {
      messages: $messages,
      chat_uuid: $chat_uuid,
      created_at: "now()",
      updated_at: "now()",
      user_id: 1
    }) {
      id
      messages
      created_at
      chat_uuid
      updated_at
    }
  }
`;

export const UPDATE_CHAT_BY_UUID = gql`
  mutation UpdateChatByUuid($chat_uuid: uuid!, $messages: jsonb!) {
    update_wamex_chat(
      where: { chat_uuid: { _eq: $chat_uuid } },
      _set: { messages: $messages }
    ) {
      returning {
        id
        messages
        created_at
        chat_uuid
        updated_at
      }
    }
  }
`;