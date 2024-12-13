import {useState, useEffect, useRef} from 'react';
import {Box, TextField, IconButton, Paper, Typography, CircularProgress} from '@mui/material';
import {Send, Add} from '@mui/icons-material';
import {useRouter} from 'next/navigation';
import {useMutation, useSubscription} from '@apollo/client';
import {v4 as uuidv4} from 'uuid';
import {CREATE_CHAT, UPDATE_CHAT_BY_UUID, SUB_CHAT_BY_UUID} from '@/gql/map';
import {api} from "@/utils/api";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatMessages {
    messages: Message[];
}

interface ChatBoxProps {
    setPointOfInterestPolygon: (polygon: string) => void;
    chatUuid: string | null;
}

interface ChatSubscriptionData {
    wamex_chat: Array<{
        messages: ChatMessages;
    }>;
}

interface ChatMutationVariables {
    messages: {
        messages: Message[];
    };
    chat_uuid: string;
}

interface CreateChatResponse {
    insert_wamex_chat_one: {
        chat_uuid: string;
        messages: ChatMessages;
    };
}

interface UpdateChatResponse {
    update_wamex_chat_by_pk: {
        chat_uuid: string;
        messages: ChatMessages;
    };
}

interface ApiResponse {
    geometry: string;
    chat_uuid: string;
    question: string;
    status: string;
    timestamp: string;
}

interface ChatApiRequest extends Record<string, unknown> {
    chat_uuid: string;
    question: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({
                                             setPointOfInterestPolygon,
                                             chatUuid
                                         }) => {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isNearBottom, setIsNearBottom] = useState<boolean>(true);

    interface SubscriptionVariables {
        chat_uuid: string | null;
    }

    // Subscriptions
    const {data: subscriptionData, loading: subLoading} = useSubscription<
        ChatSubscriptionData,
        SubscriptionVariables
    >(
        SUB_CHAT_BY_UUID,
        {variables: {chat_uuid: chatUuid}, skip: !chatUuid}
    );

    // Mutations
    const [createChat] = useMutation<CreateChatResponse, ChatMutationVariables>(CREATE_CHAT);
    const [updateChat] = useMutation<UpdateChatResponse, ChatMutationVariables>(UPDATE_CHAT_BY_UUID);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth'): void => {
        if (messagesEndRef.current && isNearBottom) {
            messagesEndRef.current.scrollIntoView({behavior});
        }
    };

    // Handle scroll events to determine if we're near bottom
    const handleScroll = (): void => {
        if (scrollContainerRef.current) {
            const {scrollTop, scrollHeight, clientHeight} = scrollContainerRef.current;
            const scrollPosition = scrollHeight - scrollTop - clientHeight;
            setIsNearBottom(scrollPosition < 100); // Consider "near bottom" when within 100px
        }
    };

    // Auto-scroll when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial scroll and subscription data handling
    useEffect(() => {
        if (subscriptionData?.wamex_chat?.[0]?.messages) {
            const chatData = subscriptionData.wamex_chat[0].messages;
            setMessages(chatData.messages || []);
            // Use 'auto' for initial load to prevent jarring animation
            scrollToBottom('auto');
        }
    }, [subscriptionData]);

    const handleSend = async (): Promise<void> => {
        if (!message.trim() || !chatUuid) return;

        const newMessage: Message = {
            role: 'user',
            content: message.trim(),
            timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...messages, newMessage];
        setMessage('');

        try {
            // Update existing chat
            await updateChat({
                variables: {
                    chat_uuid: chatUuid,
                    messages: {messages: updatedMessages}
                }
            });

            const res = await api.post<ApiResponse, ChatApiRequest>(
                '/wamex/spatial-metadata/chat/',
                {
                    chat_uuid: chatUuid,
                    question: message
                }
            );

            if (res?.geometry) {
                setPointOfInterestPolygon(res.geometry);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleNewChat = async (): Promise<void> => {
        const newUuid = uuidv4();

        try {
            await createChat({
                variables: {
                    messages: {messages: []},
                    chat_uuid: newUuid
                }
            });

            // Update URL with new chat UUID
            router.push(`?chatuuid=${newUuid}`);
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                width: '300px',
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden'
            }}
        >
            {/* Chat header */}
            <Box sx={{p: 2, borderBottom: 1, borderColor: 'divider'}}>
                <Typography variant="subtitle2">
                    {chatUuid ? `Chat: ${chatUuid.slice(0, 8)}...` : 'New Chat'}
                </Typography>
            </Box>

            {/* Messages area */}
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {subLoading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
                        <CircularProgress size={24}/>
                    </Box>
                ) : (
                    <>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 1,
                                    bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                                    borderRadius: 1,
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                }}
                            >
                                <Typography variant="body2">{msg.content}</Typography>
                            </Box>
                        ))}
                        <div ref={messagesEndRef}/>
                    </>
                )}
            </Box>

            {/* Input area */}
            <Box
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    gap: 1,
                }}
            >
                <IconButton
                    onClick={handleNewChat}
                    size="small"
                    sx={{alignSelf: 'flex-end'}}
                >
                    <Add/>
                </IconButton>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={4}
                    disabled={!chatUuid}
                />
                <IconButton
                    onClick={handleSend}
                    disabled={!message.trim() || !chatUuid}
                    size="small"
                    sx={{alignSelf: 'flex-end'}}
                >
                    <Send/>
                </IconButton>
            </Box>
        </Paper>
    );
};

export default ChatBox;