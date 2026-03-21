import { default as api } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// --- Types ---

export interface Profile {
    id: string;
    name: string;
    age: number;
    bio: string;
    image: string;
    interests: string[];
    location: {
        latitude: number;
        longitude: number;
        city?: string;
    };
}

export interface Message {
    id: string;
    senderId: 'me' | string;
    text: string;
    timestamp: number;
}

export interface Conversation {
    id: string;
    partner: Profile;
    messages: Message[];
    lastMessage?: string;
    lastMessageTimestamp?: number;
    unreadCount: number;
    isLoading?: boolean;
    error?: string;
    hasLoadedMessages?: boolean;
}

export interface UserProfile {
    name: string;
    photos: (string | null)[];
    interests: string[];
    bio?: string;
    age?: number;
    location?: {
        latitude: number;
        longitude: number;
        city?: string;
    };
}

interface AppContextType {
    userProfile: UserProfile;
    updateUserProfile: (data: Partial<UserProfile>) => void;

    potentialMatches: Profile[];
    matches: Profile[];
    conversations: Conversation[];

    swipeLeft: (profileId: string) => void;
    swipeRight: (profileId: string) => void;

    sendMessage: (conversationId: string, text: string) => Promise<void>;
    fetchMessages: (matchId: string) => Promise<void>;
    getConversation: (id: string) => Conversation | undefined;
    logout: () => Promise<void>;
    fetchUserProfile: () => Promise<void>;
    fetchMatches: () => Promise<void>;
    fetchPotentialMatches: () => Promise<void>;

    // Map methods
    getNearbyUsers: (maxDistance?: number) => Promise<any[]>;
    updateMapLocation: (latitude: number, longitude: number, showOnMap: boolean) => Promise<void>;
}

// --- Dummy Data ---


// --- Context ---

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: '',
        photos: [],
        interests: [],
    });
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const [potentialMatches, setPotentialMatches] = useState<Profile[]>([]);
    const [matches, setMatches] = useState<Profile[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const fetchMatches = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (accessToken) {
                console.log('[AppContext] Fetching matches...');
                const matchesResponse = await api.getMatches(accessToken);
                if (matchesResponse.data) {
                    console.log('[AppContext] Received matches:', matchesResponse.data.length);
                    // Transform backend matches to frontend format
                    const backendMatches = matchesResponse.data.map((match: any) => ({
                        id: match.userId,
                        name: match.profile?.name || 'Unknown',
                        age: match.profile?.age || 0,
                        bio: match.profile?.bio || '',
                        image: match.profile?.photos?.[0] || '',
                        interests: match.profile?.interests || [],
                        location: { latitude: 0, longitude: 0 },
                    }));
                    setMatches(backendMatches);

                    const conversations = matchesResponse.data.map((match: any) => ({
                        id: match.matchId,
                        partner: {
                            id: match.userId,
                            name: match.profile?.name || 'Unknown',
                            age: match.profile?.age || 0,
                            bio: match.profile?.bio || '',
                            image: match.profile?.photos?.[0] || '',
                            interests: match.profile?.interests || [],
                            location: { latitude: 0, longitude: 0 },
                        },
                        messages: [], // Will be loaded when opening chat
                        lastMessage: match.lastMessage,
                        lastMessageTimestamp: match.lastMessageAt ? new Date(match.lastMessageAt).getTime() : undefined,
                        unreadCount: 0,
                    }));
                    setConversations(conversations);
                    console.log('[AppContext] Matches updated successfully');
                }
            }
        } catch (error) {
            console.error('[AppContext] Failed to fetch matches:', error);
        }
    };

    const fetchUserProfile = async () => {
        try {
            // Check for existing session and fetch profile
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (accessToken) {
                try {
                    const profileResponse = await api.getProfile(accessToken);
                    if (profileResponse.data) {
                        // Set current user ID from profile
                        if (profileResponse.data.userId) {
                            setCurrentUserId(profileResponse.data.userId);
                            console.log('[AppContext] Current user ID set:', profileResponse.data.userId);
                        }
                        setUserProfile({
                            name: profileResponse.data.name || '',
                            photos: profileResponse.data.photos || [],
                            interests: profileResponse.data.interests || [],
                            bio: profileResponse.data.bio,
                            age: profileResponse.data.age,
                            location: profileResponse.data.location
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                await fetchUserProfile();

                // Fetch matches from backend
                await fetchMatches();

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Permission to access location was denied');
                }

                // Get user location
                let userLoc = { latitude: 0, longitude: 0 };
                try {
                    const location = await Location.getCurrentPositionAsync({});
                    userLoc = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };
                    setUserProfile(prev => ({ ...prev, location: userLoc }));
                } catch (e) {
                    console.warn('Could not get precise location');
                }

                // Fetch potential matches from API
                await fetchPotentialMatches();

            } catch (error) {
                console.log('Error initializing discovery:', error);
            }
        })();
    }, []);

    const fetchPotentialMatches = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (accessToken) {
                const response = await api.getPotentialMatches(accessToken);
                if (response.data) {
                    const profiles = response.data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        age: p.age,
                        bio: p.bio,
                        image: p.image,
                        interests: p.interests,
                        location: p.location
                    }));
                    setPotentialMatches(profiles);
                }
            }
        } catch (error) {
            console.error('Failed to fetch potential matches:', error);
        }
    };

    const updateUserProfile = (data: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...data }));
    };

    const swipeLeft = async (profileId: string) => {
        // Optimistic update
        setPotentialMatches(prev => prev.filter(p => p.id !== profileId));

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                await api.swipe(profileId, 'PASS', token);
            }
        } catch (error) {
            console.error('Failed to record pass swipe:', error);
        }
    };

    const swipeRight = async (profileId: string) => {
        const profile = potentialMatches.find(p => p.id === profileId);
        if (!profile) return;

        // Optimistic update
        setPotentialMatches(prev => prev.filter(p => p.id !== profileId));

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                const response = await api.swipe(profileId, 'LIKE', token);

                if (response.data && response.data.isMatch) {
                    console.log(`It's a match with ${profile.name}!`);
                    setMatches(prev => [...prev, profile]);

                    // Create a conversation locally
                    setConversations(prev => {
                        if (prev.find(c => c.partner.id === profileId)) return prev;
                        return [...prev, {
                            id: response.data?.match?._id || Date.now().toString(),
                            partner: profile,
                            messages: [],
                            lastMessage: "It's a match! Say hello.",
                            lastMessageTimestamp: Date.now(),
                            unreadCount: 1,
                        }];
                    });
                }
            }
        } catch (error) {
            console.error('Failed to record like swipe:', error);
        }
    };

    const fetchMessages = async (matchId: string) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) return;

            console.log('[fetchMessages] Fetching messages for matchId:', matchId);
            const response = await api.getMessages(matchId, token, 1, 50);

            if (response.data && response.data.messages) {
                console.log('[fetchMessages] Received messages:', response.data.messages.length);

                // Update conversation with fetched messages
                setConversations(prev => prev.map(conv => {
                    if (conv.id === matchId) {
                        const messages = response.data.messages.map((msg: any) => ({
                            id: msg.id,
                            senderId: msg.senderId === conv.partner.id ? conv.partner.id : 'me',
                            text: msg.content,
                            timestamp: new Date(msg.createdAt).getTime(),
                        }));
                        return { ...conv, messages };
                    }
                    return conv;
                }));
            }
        } catch (error) {
            console.error('[fetchMessages] Failed to fetch messages:', error);
        }
    };

    const sendMessage = async (conversationId: string, text: string) => {
        const tempId = `temp-${Date.now()}`;

        // Optimistically add message with temp ID immediately
        setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                const tempMessage: Message = {
                    id: tempId,
                    senderId: 'me',
                    text,
                    timestamp: Date.now(),
                };
                return {
                    ...conv,
                    messages: [...conv.messages, tempMessage],
                    lastMessage: text,
                    lastMessageTimestamp: tempMessage.timestamp,
                };
            }
            return conv;
        }));

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                console.error('[sendMessage] No access token found');
                return;
            }

            console.log('[sendMessage] Sending message to matchId:', conversationId);

            // Send to backend
            const response = await api.sendMessage(conversationId, text, token);

            if (response.data) {
                console.log('[sendMessage] Message sent successfully:', response.data);

                // Optimistically update local state
                setConversations(prev => prev.map(conv => {
                    if (conv.id === conversationId) {
                        const newMessage: Message = {
                            id: response.data?.id || Date.now().toString(),
                            senderId: 'me',
                            text,
                            timestamp: Date.now(),
                        };
                        return {
                            ...conv,
                            messages: [...conv.messages, newMessage],
                            lastMessage: text,
                            lastMessageTimestamp: newMessage.timestamp,
                            unreadCount: 0,
                        };
                    }
                    return conv;
                }));
            }
        } catch (error) {
            console.error('[sendMessage] Failed to send message:', error);
        }
    };

    const getConversation = (id: string) => {
        return conversations.find(c => c.id === id);
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
            setUserProfile({
                name: '',
                photos: [],
                interests: [],
            });
            setCurrentUserId('');
            setPotentialMatches([]);
            setMatches([]);
            setConversations([]);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getNearbyUsers = async (maxDistance: number = 5000) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token');
            }

            const response = await api.getNearbyUsers(token, maxDistance);
            // API now returns { isPremium, maxDistance, users } — extract the array
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (data?.users && Array.isArray(data.users)) return data.users;
            return [];
        } catch (error) {
            console.error('[getNearbyUsers] Error:', error);
            return [];
        }
    };

    const updateMapLocation = async (latitude: number, longitude: number, showOnMap: boolean) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token');
            }

            await api.updateMapLocation(latitude, longitude, showOnMap, token);
            console.log('[updateMapLocation] Location updated successfully');
        } catch (error) {
            console.error('[updateMapLocation] Error:', error);
            throw error;
        }
    };

    return (
        <AppContext.Provider
            value={{
                userProfile,
                updateUserProfile,
                potentialMatches,
                matches,
                conversations,
                swipeLeft,
                swipeRight,
                sendMessage,
                fetchMessages,
                getConversation,
                logout,
                fetchUserProfile,
                fetchMatches,
                fetchPotentialMatches,
                getNearbyUsers,
                updateMapLocation,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
