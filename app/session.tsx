// app/session.tsx
import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { firestore } from "../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

interface Participant {
  id: string;
  nickname: string;
}

interface RoomData {
  prompt: string;
  participants: Participant[];
  turnIndex: number;
  status: string;
  aiResponse?: string;
  responses?: Record<string, string>;
  file?: string;
}

export default function Session() {
  // Use useLocalSearchParams to obtain query parameters
  const { roomCode, participantId } = useLocalSearchParams<{
    roomCode: string;
    participantId?: string;
  }>();
  const router = useRouter();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Participant | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!roomCode) {
      setError("No room code provided.");
      setLoading(false);
      return;
    }
    const roomRef = doc(firestore, "rooms", roomCode);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) {
        setError("Room not found.");
        setRoom(null);
      } else {
        const data = docSnap.data() as RoomData;
        setRoom(data);
        if (data.participants && data.participants.length > 0) {
          setCurrentTurn(data.participants[data.turnIndex]);
        }
        setError("");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [roomCode]);

  const submitAnswer = async () => {
    if (!roomCode || !participantId) return;
    try {
      const roomRef = doc(firestore, "rooms", roomCode);
      await updateDoc(roomRef, {
        responses: {
          ...room?.responses,
          [participantId]: answer,
        },
      });
      setAnswer("");
    } catch (err) {
      console.error("Submit answer error:", err);
    }
  };

  const endTurn = async () => {
    if (!roomCode || !room) return;
    try {
      const roomRef = doc(firestore, "rooms", roomCode);
      const newTurnIndex = (room.turnIndex + 1) % room.participants.length;
      await updateDoc(roomRef, { turnIndex: newTurnIndex });
    } catch (err) {
      console.error("End turn error:", err);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Loading session...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">{error}</Text>
        <Button
          title="Go Back"
          onPress={() => router.push("/room-creation")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 justify-center items-center bg-white">
      {room && room.status === "waiting" && (
        <Button
          title="Start Session"
          onPress={async () => {
            const roomRef = doc(firestore, "rooms", roomCode);
            await updateDoc(roomRef, { status: "in-session" });
          }}
        />
      )}
      {room && room.status === "in-session" && (
        <View className="w-full items-center">
          <Text className="text-xl font-bold mb-2">
            AI Prompt: {room.prompt}
          </Text>
          {room.file && <Text className="mb-2">Attached File: {room.file}</Text>}
          <Text className="text-lg mb-2">
            Current Turn: {currentTurn ? currentTurn.nickname : "Loading..."}
          </Text>
          {participantId && currentTurn && participantId === currentTurn.id ? (
            <>
              <TextInput
                placeholder="Your answer"
                value={answer}
                onChangeText={setAnswer}
                className="w-full p-3 border border-gray-300 rounded mb-4"
              />
              <Button title="Submit Answer" onPress={submitAnswer} />
              <View className="mt-4">
                <Button title="End Turn" onPress={endTurn} />
              </View>
            </>
          ) : (
            <Text className="mt-4">
              Waiting for {currentTurn ? currentTurn.nickname : "loading..."}
            </Text>
          )}
        </View>
      )}
      {room && room.aiResponse && (
        <View className="mt-8 items-center">
          <Text className="text-xl font-bold">AI Response:</Text>
          <Text className="mt-2 text-center">{room.aiResponse}</Text>
        </View>
      )}
    </View>
  );
}
