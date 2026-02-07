import { calculateDistance } from '@/utils/location';
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

    sendMessage: (conversationId: string, text: string) => void;
    getConversation: (id: string) => Conversation | undefined;
}

// --- Dummy Data ---

const DUMMY_PROFILES: Profile[] = [
    {
        id: '1',
        name: 'Jessica',
        age: 24,
        bio: 'Adventure seeker | Coffee lover | Photography 📸',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
        interests: ['Hiking', 'Photography', 'Coffee'],
        location: { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco' }, // SF
    },
    {
        id: '2',
        name: 'Michael',
        age: 26,
        bio: 'Tech enthusiast building the future 🚀',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
        interests: ['Tech', 'Coding', 'Gaming'],
        location: { latitude: 37.7849, longitude: -122.4094, city: 'San Francisco' }, // Near SF
    },
    {
        id: '3',
        name: 'Sarah',
        age: 23,
        bio: 'Artist at heart. Love to paint and travel 🎨✈️',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
        interests: ['Art', 'Travel', 'Painting'],
        location: { latitude: 37.8049, longitude: -122.4294, city: 'San Francisco' },
    },
    {
        id: '4',
        name: 'David',
        age: 25,
        bio: 'Music is my life. Let\'s jam! 🎸',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
        interests: ['Music', 'Guitar', 'Concerts'],
        location: { latitude: 37.3382, longitude: -121.8863, city: 'San Jose' }, // Further away
    },
    {
        id: '5',
        name: 'Emma',
        age: 22,
        bio: 'Foodie who loves to explore new restaurants 🍕',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
        interests: ['Food', 'Cooking', 'Travel'],
        location: { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' }, // Far away
    },
];

// --- Context ---

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: '',
        photos: [],
        interests: [],
    });

    const [potentialMatches, setPotentialMatches] = useState<Profile[]>(DUMMY_PROFILES);
    const [matches, setMatches] = useState<Profile[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Permission to access location was denied');
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                const userLoc = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                setUserProfile(prev => ({ ...prev, location: userLoc }));

                // Sort potential matches by distance
                const sortedProfiles = [...DUMMY_PROFILES].sort((a, b) => {
                    const distA = calculateDistance(userLoc.latitude, userLoc.longitude, a.location.latitude, a.location.longitude);
                    const distB = calculateDistance(userLoc.latitude, userLoc.longitude, b.location.latitude, b.location.longitude);
                    return distA - distB;
                });

                setPotentialMatches(sortedProfiles);
            } catch (error) {
                console.log('Error fetching location:', error);
            }
        })();
    }, []);

    const updateUserProfile = (data: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...data }));
    };

    const swipeLeft = (profileId: string) => {
        setPotentialMatches(prev => prev.filter(p => p.id !== profileId));
    };

    const swipeRight = (profileId: string) => {
        const profile = potentialMatches.find(p => p.id === profileId);
        if (!profile) return;

        // Simulate a match logic (e.g., 50% chance or forced for demo)
        // For demo purposes, let's say we match with everyone we swipe right on! 
        // Or to make it realistic, let's match with Profiles 1, 3, and 5.
        const shouldMatch = ['1', '3', '5'].includes(profileId) || Math.random() > 0.5;

        if (shouldMatch) {
            setMatches(prev => [...prev, profile]);
            // Create a conversation if it doesn't exist
            setConversations(prev => {
                if (prev.find(c => c.partner.id === profileId)) return prev;
                return [...prev, {
                    id: Date.now().toString(),
                    partner: profile,
                    messages: [],
                    lastMessage: "It's a match! Say hello.",
                    lastMessageTimestamp: Date.now(),
                    unreadCount: 1,
                }];
            });
            console.log(`Matched with ${profile.name}!`);
        }

        setPotentialMatches(prev => prev.filter(p => p.id !== profileId));
    };

    const sendMessage = (conversationId: string, text: string) => {
        setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                const newMessage: Message = {
                    id: Date.now().toString(),
                    senderId: 'me',
                    text,
                    timestamp: Date.now(),
                };
                return {
                    ...conv,
                    messages: [...conv.messages, newMessage],
                    lastMessage: text,
                    lastMessageTimestamp: newMessage.timestamp,
                };
            }
            return conv;
        }));
    };

    const getConversation = (id: string) => {
        return conversations.find(c => c.id === id);
    };

    return (
        <AppContext.Provider value={{
            userProfile,
            updateUserProfile,
            potentialMatches,
            matches,
            conversations,
            swipeLeft,
            swipeRight,
            sendMessage,
            getConversation
        }}>
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
